---
title: Isolation Levels
description: One of many posts about (Postgres) isolation levels.
date: 2026-11-15
---

After "learning" isolation levels multiple times, I always felt that I never
fully had the behaviors down. This is my attempt to solidify the behaviors once
and for all. Aside from the read uncommitted isolation level, I will discuss
these in the context of Postgres.

## Isolation-Level-Agnostic Behavior

Before diving into behaviors due to the different isolation levels, there are
some general Postgres behaviors that should be noted, since I found these to be
a source of confusion for a while.

### Write Lock Lifetimes

Write locks (for UPDATE and DELETE) are held until the end of the transaction.
Even if an UPDATE is run as the first statement in a transaction, the row is
write-locked (but can still be read). This means that if two transasctions at
arbitrary isolation levels try to UPDATE the same row, then the one that UPDATEs
later must wait for the other transaction to COMMIT or ROLLBACK first.

The fact that locks are held through the end of the transaction means that
deadlocks can happen. If transaction A grabs the lock on row 1 while transaction
B grabs the lock on row 2, then transaction A tries to get the lock on row 1
while transaction B tries to get the lock on row 2, a deadlock occurs, and one
transaction is aborted.

### Database Constraints

Database table constraints still apply outside of transactions. If two
transactions try to insert or update a column in a table such that a table
constraint is broken (e.g., uniqueness), then a transaction will be rejected
accordingly. Transaction levels don't allow strict database constraints to be
circumvented.

### Transaction-Local Writes

Regardless of transaction level, a transaction is able to see the effect of its
own writes. Whether a transaction can see the effect of other transactions'
writes comes down to the isolation level.

## What are Isolation Levels?

Isolation levels in databases are a transaction option that allows a transaction
to run with certain guarantees at the cost of tradeoffs. As an example, one
isolation level (repeatable read) guarantees that every read within the
transaction is consistent based on a given snapshot and every update runs on an
row unmodified by other transactions, at the cost of aborting the transaction
when some of these guarantees cannot be upheld.

In general, there are four isolation levels, in order of increasing guarantees.

- Read Uncommitted
- Read Committed
- Repeatable Read
- Serializable

## Read Uncommitted

This is the lowest isolation level. In fact, Postgres does not actually
implement read uncommitted, and instead uses the read committed isolation level
whenever this level is requested.

Each database provider is allowed to provide their own implementation of this
isolation level. In general, a _true_ read uncommitted transaction provides the
weakest isolation guarantees. If any other transaction has any _uncommitted_
changes to the database, a read uncommitted transaction might reflect those
updates. This phenomenon is called a **dirty read**.

Below is one such example of a dirty read. While transaction A doesn't need to
protect itself from transaction B based on the fact that it is read uncommitted,
it does run the risk of taking on transaction B's updated values, despite
transaction B eventually rolling back.

```sql
-- read uncommitted

-- transaction A                            transaction B

BEGIN ISOLATION LEVEL READ UNCOMMITTED;     BEGIN;
-- might not be valid in postgres

SELECT balance
FROM accounts
WHERE id = 1;
-- return 100
                                            UPDATE accounts
                                            SET balance = 200
                                            WHERE id = 1;
SELECT balance
FROM accounts
WHERE id = 1;
-- return 200
                                            ROLLBACK;
COMMIT;
```

## Read Committed

This is the next higher isolation level, and exists to prevent dirty reads. Read
committed is Postgres' default isolation level. In a read committed transaction,
any SELECT will return only values that have been committed already.

A read committed transaction can be aborted due to isolation-level-agnostic
reasons mentioned above (e.g., deadlock due to UPDATE order), but there are no
isolation-level-specific reasons for such a transaction to be aborted.

There are two relevant phenomena at this level (both of which exist for read
uncommitted transactions as well): **non-repeatable reads** and **phantom
reads**.

### Non-Repeatable Reads

In the below example, we see that the read is no longer dirty; transaction A
only returns the new value from the database after B commits. However, multiple
reads within transaction A of a row that A doesn't touch can return different
results over time, depending on the behavior of other transactions. This is a
non-repeatable read, and is most directly related to the idea of respecting
other transactions' committed changes. Although noted as a "phenomenon", this
behavior might be desired, depending on the use case.

```sql
-- read committed, demonstrating non-repeatable read

-- transaction A                        transaction B

BEGIN;                                  BEGIN;
-- defaults to read committed

SELECT balance
FROM accounts
WHERE id = 1;
-- return 100
                                        UPDATE accounts
                                        SET balance = 200
                                        WHERE id = 1;
SELECT balance
FROM accounts
WHERE id = 1;
-- return 100 (B did not yet commit)
                                        COMMIT;
SELECT balance
FROM accounts
WHERE id = 1;
-- return 200 (non-repeatable read).

COMMIT;
```

### Phantom Reads

A phantom read is a state where a transaction might retrieve new rows through
the transaction itself, based on the INSERT (or DELETE) behavior of other
transactions. The example below shows transaction A retrieving more rows in its
second SELECT due to transaction B's INSERT.

```sql
-- read committed, demonstrating phantom reads

-- transaction A                        transaction B

BEGIN;                                  BEGIN;
-- defaults to read committed

SELECT account_name
FROM accounts
WHERE balance < 200;
-- return John, Joe
                                        INSERT INTO accounts
                                        VALUES ('Amy', 150);

                                        COMMIT;
SELECT account_name
FROM accounts
WHERE balance < 200;
-- return John, Joe, Amy

COMMIT;
```

### More on UPDATE

Another example shows how UPDATEs in a read committed transaction might behave.
In this example, we see that A cannot UPDATE the row until after B commits, but
can still read the (existing) value of the row during this time. Once B commits,
A can UPDATE based on the row's new value.

```sql
-- read committed, demonstrating concurrent UPDATEs

-- transaction A (read committed)       transaction B

BEGIN;                                  BEGIN;

                                        UPDATE accounts
                                        SET balance = 200
                                        WHERE id = 1;
SELECT balance
FROM accounts
WHERE id = 1;
-- return 100

UPDATE accounts
SET balance = balance + 50
WHERE id = 1;
-- must wait on B to commit
                                        COMMIT;
                                        -- lock released
-- UPDATE runs

SELECT balance
FROM accounts
WHERE id = 1;
-- return 250

COMMIT;
```

## Repeatable Read

This is the next higher isolation level, and exists to prevent non-repeatable
reads (hence the name). There are two poignant properties of a repeatable read
transaction: (1) reads are performed from a transaction-local snapshot of the
database, and (2) concurrent updates on the same row will abort the transaction.

It should be noted that the implementation of repeatable read transactions in
Postgres in particular also guards against phantom reads, though this is not
necessarily true of other database flavors. Once a transaction-level snapshot is
taken, later INSERTs by other transactions are not reflected in the snapshot.

### Transaction-Local Snapshot

Reading based on a snapshot is the main solution to the non-repeatable read
phenomenon. By taking a snapshot at the beginning of the transaction, every read
performed during the transaction is now guaranteed to follow the
transaction-local state of the database. As mentioned above, the local snapshot
also incorporates any in-transaction writes.

Below is an example demonstrating the repeatable reads.

```sql
-- repeatable read, demonstrating repeatable reads

-- transaction A (repeatable read)              transaction B

BEGIN ISOLATION LEVEL REPEATABLE READ;          BEGIN;
-- snapshot taken with balance = 100

SELECT balance
FROM accounts
WHERE id = 1;
-- return 100
                                                UPDATE accounts
                                                SET balance = 200
                                                WHERE id = 1;
SELECT balance
FROM accounts
WHERE id = 1;
-- return 100
                                                COMMIT;
SELECT balance
FROM accounts
WHERE id = 1;
-- still return 100

UPDATE accounts
SET balance = 200
WHERE id = 1;

SELECT balance
FROM accounts
WHERE id = 1;
-- now return 200

COMMIT;
```

### Concurrent Row Update Serialization Failures

However, it is entirely possible that the snapshot and the actual database can
drift, resulting in the second property as a by product. Since a row that has
been updated by a separate transaction now has two separate states (in the
snapshot vs. in the database), the behavior of a further update on that row in a
repeatable read transaction becomes undefined. As such, Postgres will error with
a serialization failure and abort the repeatable read transaction. Note that the
isolation level of the other transaction is not necessarily relevant; it only
matters what the other transaction updates.

The example below shows such a case where transaction A tries to update a row
that B recently committed. So long as transaction A takes its snapshot before
transaction B commits, then the serialization failure will arise. The content of
the UPDATE does not matter, as Postgres is conservative in its serialization
failure determination. This means that even having `SET balance = 300` (an
operation that does not depend on the existing balance) results in a
serialization failure.

```sql
-- repeatable read, demonstrating serialization failure

-- transaction A (repeatable read)              transaction B

BEGIN ISOLATION LEVEL REPEATABLE READ;          BEGIN;
-- snapshot taken with balance = 100
                                                UPDATE accounts
                                                SET balance = 200
                                                WHERE id = 1;

                                                COMMIT;

UPDATE accounts
SET balance = balance + 50
WHERE id = 1;
-- 40001: serialization_failure
-- should balance be 150 or 250?

ROLLBACK;
```

Specifically, repeatable read transactions will only result in serialization
failures when they modify the same row that was modified by another transaction;
simply reading such a row is not enough to result in the serialization failure.

Interestingly, an UPDATE on a row that was INSERTed by a separate transaction
will _not_ result in a serialization failure. Instead, Postgres handles this
case by simply updating nothing. If phantom reads were possible in repeatable
read transactions in Postgres, then it's likely that this condition would also
result in a serialization failure.

### Write Skew

Suppose I have a repeatable-read database transaction that does the following.
It gets all of the doctors that are currently on-call in a hospital. If there
are more than one on-call, then it removes all doctors except for one, with the
goal of maintaining at least one on-call doctor at any given point. Suppose that
this runs twice, with two transactions interacting in the following way. This is
a phenomenon called **write skew** because multiple writes result in the
database having data that is a mix of the two transactions.

```sql
-- repeatable read, demonstrating write skew

-- transaction A (repeatable read)      transaction B (repeatable read)

BEGIN ISOLATION LEVEL REPEATABLE READ;  BEGIN ISOLATION LEVEL REPEATABLE READ;

SELECT COUNT(*) FROM doctors
WHERE on_call = TRUE;
-- return 2
                                        SELECT COUNT(*) FROM doctors
                                        WHERE on_call = TRUE;
                                        -- return 2
UPDATE doctors
SET on_call = FALSE
WHERE doctor_name = 'Alice';
-- only run this if
-- above yielded > 1
                                        UPDATE doctors
                                        SET on_call = FALSE
                                        WHERE doctor_name = 'Bob';
                                        -- only run this if
                                        -- above yielded > 1

COMMIT;                                 COMMIT;
-- at this point, no doctor is on-call
```

In this case, both repeatable read transactions succeed, because they did not
UPDATE the same row. However, this results in a case where no doctors are
on-call, which is undesirable. This occurred because the initial count depended
on rows that were subsequently modified later in the transaction, but because
they were not explicitly modified concurrently, the repeatable read transaction
did not fail them.

## Serializable

This is the highest isolation level, providing the most guarantees of the
isolation levels at the cost of having the largest failure set. Compared to the
repeatable read isolation level, the primary advantage is that it prevents write
skew, which was demonstrated above.

The formal definition of a serializable transaction is that its outputs are the
result of some serial ordering of transactions, otherwise a serialization
failure is returned. Furthermore, the "transactions" mentioned above only
include other _serializable_ transactions. The reason is that Postgres only
tracks serializable snapshot isolation (SSI) for serializable transactions, and
so they are the only transactions relevant to this discussion.

The idea of "being the result of some serial ordering of transactions" was
always confusing to me, so it can be better thought of as "multiple serializable
transactions have cyclic dependencies".

By using a serializable transaction for the doctor example above, we can see
that using a serializable isolation level now causes one of the transactions to
abort. In the particular example, Postgres' SSI detects that both transactions
read the same rows from the `doctors` table, while also updating rows within the
same table. Thus, transaction A's initial SELECT depends on the UPDATE from B,
and vice versa. Therefore, there is no serial ordering of these two
transactions, and thus at least one of these should fail. Postgres does not
guarantee which one fails, but rather that at least one will fail.

```sql
-- serializable, preventing write skew

-- transaction A (serializable)         transaction B (serializable)

BEGIN ISOLATION LEVEL SERIALIZABLE;     BEGIN ISOLATION LEVEL SERIALIZABLE;

SELECT COUNT(*) FROM doctors
WHERE on_call = TRUE;
-- return 2
                                        SELECT COUNT(*) FROM doctors
                                        WHERE on_call = TRUE;
                                        -- return 2
UPDATE doctors
SET on_call = FALSE
WHERE doctor_name = 'Alice';
-- only run this if
-- above yielded > 1
                                        UPDATE doctors
                                        SET on_call = FALSE
                                        WHERE doctor_name = 'Bob';
                                        -- only run this if
                                        -- above yielded > 1

-- one of these will fail, but which is not guaranteed by Postgres
```

In general, serializable transactions' use cases have always been less clear
than repeatable read transactions. However, some use cases might include
enforcing invariants across multiple rows (such as this on-call doctor example),
complex read-modify-write transactions across several tables, or instead of
manually locking certain rows for larger changes.
