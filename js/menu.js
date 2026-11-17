function toggleMenu() {
  var menuList = document.getElementsByClassName("menu-list")[0];
  var menuButton = document.getElementById("menu-btn");
  if (!menuList || !menuButton) return;
  var open = menuList.classList.toggle("active");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.textContent = open ? "Close" : "Menu";
}
