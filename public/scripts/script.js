document.addEventListener("DOMContentLoaded", () => {
    const navBar = document.querySelector("nav"),
        menuBtns = document.querySelectorAll(".menu-icon"),
        overlay = document.querySelector(".overlay");

    menuBtns.forEach((menuBtn) => {
        menuBtn.addEventListener("click", () => {
            navBar.classList.toggle("open");
        });
    });

    overlay.addEventListener("click", () => {
        navBar.classList.remove("open");
    });

    const profile_section = document.getElementById("profile-section-main");
    if (profile_section) {
        const forum_btn = document.getElementById("forum-btn");
        const profil_btn = document.getElementById("profil-btn");

        forum_btn.addEventListener("click", () => {
            profile_section.style.display = "none";
        });
        profil_btn.addEventListener("click", () => {
            profile_section.style.display = "flex";
        });
    }
});
