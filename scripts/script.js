function loadHeader() {
    let headerContainer = document.getElementById('header-container');
    const header = `
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/projects">Projects</a>
        <a href="/resume.pdf" target="_blank">Resume</a>
    `;

    headerContainer.innerHTML = header;
}

function loadFooter() {
    let footerContainer = document.getElementById('footer-container');
    const footer = `
        <p id="contact-title">Contact me:</p>
        <div id="footer-links">
        <a href='mailto:michaelzhan2001@gmail.com'>
            <i class="fa-solid fa-envelope"></i>
        </a>
        <a href="https://www.linkedin.com/in/michaelzhan1/">
            <i class="fa-brands fa-linkedin"></i>
        </a>
        <a href="https://www.github.com/michaelzhan1/">
            <i class="fa-brands fa-github"></i>
        </a>
        </div>
        <p id="copyright">© 2026 Michael Zhan</p>
    `;

    footerContainer.innerHTML = footer;
}

loadHeader();
loadFooter();