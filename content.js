function run() {
  const userNameElems = [...document.getElementsByClassName("user-name")];

  const getShowMoreBtn = () =>
    document.querySelector(".u-fontSize12.cursor-pointer.text--primary");

  userNameElems.forEach((elem) => (elem.contextMenu = "userBlockMenu"));
  const userNameSet = userNameElems.reduce(
    (acc, curr) => acc.add(curr.textContent),
    new Set(),
  );
  const blockList = JSON.parse(localStorage.getItem("blockList") || "{}");

  // Filter
  const filterThread = (blockList) => {
    if (!blockList) {
      console.error("Invalid user block list");
      return;
    }
    [...document.getElementsByClassName("reply-item")].forEach((elem) => {
      const username = elem.querySelector(".user-name").textContent;
      elem.style.cssText = blockList[username]
        ? "display: none !important;"
        : "";
    });
  };

  const expandThread = () => {
    const showMoreBtn = getShowMoreBtn();
    if (!showMoreBtn) {
      const expandDone = new CustomEvent("expandDone");
      document.body.dispatchEvent(expandDone);
      return;
    }
    showMoreBtn.click();
    setTimeout(expandThread, 500);
  };

  // Expand all button
  const expandAllBtn = document.createElement("button");
  expandAllBtn.innerHTML = "展開所有回覆";
  expandAllBtn.className = "expand-all-btn plain-btn";
  expandAllBtn.addEventListener("click", () => {
    expandAllBtn.style.display = "none";
    expandThread();
  });
  getShowMoreBtn()?.insertAdjacentElement("afterend", expandAllBtn);

  document.body.addEventListener("expandDone", () => filterThread(blockList));

  // Menu
  let currentUserName = "";

  const menu = document.createElement("menu");
  menu.className = "user-block-menu";
  menu.id = "userBlockMenu";
  const menuItemForBlock = document.createElement("button");
  menuItemForBlock.className = "plain-btn";
  menuItemForBlock.textContent = "過濾此使用者";
  menuItemForBlock.addEventListener("click", addToBlockList);
  menu.appendChild(menuItemForBlock);

  document.body.appendChild(menu);

  const postItemElem = document.querySelector(".post-item");

  postItemElem.addEventListener("contextmenu", (evt) => {
    if (evt.target.classList.contains("user-name")) {
      evt.preventDefault();
      menu.style.left = evt.pageX + "px";
      menu.style.top = evt.pageY - scrollY + "px";
      menu.style.display = "block";
      currentUserName = evt.target.textContent;
    }
  });

  postItemElem.addEventListener("click", () => {
    menu.style.display = "";
  });
  menu.addEventListener("click", () => {
    menu.style.display = "";
  });

  function addToBlockList () {
    if (!currentUserName) {
      return;
    }
    blockList[currentUserName] = true;
    localStorage.setItem("blockList", JSON.stringify(blockList));
    currentUserName = "";
    filterThread(blockList);
    refreshBlockList();
  };

  // Block list
  const replyGroupElem = document.querySelector(".reply-group");
  const blockListElem = document.createElement("div");
  blockListElem.className = "column-item";
  blockListElem.innerHTML = `
    <div class="section-title">已過濾使用者</div>
    <div class="column-item__content">
      <ul class="block-list"></ul>
    </div>
  `;
  replyGroupElem.insertAdjacentElement('afterend', blockListElem);

  function refreshBlockList() {
    const ul = blockListElem.querySelector(".block-list");
    ul.innerHTML = "";
    Object.keys(blockList).forEach((username) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = username;
      const button = document.createElement("button");
      button.className = "plain-btn remove-blocked-user-btn";
      button.textContent = "移除";
      button.addEventListener("click", () => {
        delete blockList[username];
        localStorage.setItem("blockList", JSON.stringify(blockList));
        filterThread(blockList);
        refreshBlockList();
      });
      li.appendChild(span);
      li.appendChild(button);
      ul.appendChild(li);
    });
  }

  // Initialize
  const init = () => {
    filterThread(blockList);
    refreshBlockList();
  };

  init();

  // Style

  const styleSheet = document.createElement("style");
  styleSheet.innerHTML = `
      .user-block-menu {
          background-color: white;
          border: 1px solid #ccc;
          z-index: 1000;
          padding: 5px;
          display: none;
          position: fixed;
      }
      .plain-btn {
          border: none;
          background: none;
          color: #f79420;
          font-size: .875rem;
      }
  `;
  document.head.appendChild(styleSheet);
}

function waitUntilPostItemAppear() {
  let retries = 0;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if(retries > 20) {
        clearInterval(interval);
        reject();
      }
      if (document.querySelector(".post-item")) {
        clearInterval(interval);
        resolve();
      }
      retries++;
    }, 500);
  });
}

if(window.location.href.includes('post_id=')) {
  window.addEventListener("load", () => {
    waitUntilPostItemAppear().then(run);
  });
}