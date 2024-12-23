function run() {
  const getShowMoreBtn = postItemElem =>
    postItemElem.querySelector(".u-fontSize12.cursor-pointer.text--primary");

  const blockList = JSON.parse(localStorage.getItem("blockList") || "{}");
  const postItemElemList = document.getElementsByClassName("post-item");
  const postContainerElem = document.querySelector("#post-container");
  const userOptions = JSON.parse(localStorage.getItem("userOptions") || "{}");

  // Filter
  const filterThread = (postItemElem, blockList) => {
    if (!blockList) {
      console.error("Invalid user block list");
      return;
    }
    [...postItemElem.getElementsByClassName("reply-item")].forEach((elem) => {
      const username = elem.querySelector(".user-name").textContent;
      elem.style.cssText = blockList[username]
        ? "display: none !important;"
        : "";
    });
  };

  const filterAllThreads = (blockList) => {
    [...postItemElemList].forEach((elem) => filterThread(elem, blockList));
  };

  const expandThread = (postItemElem) => {
    const showMoreBtn = getShowMoreBtn(postItemElem);
    if (!showMoreBtn) {
      const expandDone = new CustomEvent("expandDone");
      postItemElem.dispatchEvent(expandDone);
      return;
    }
    showMoreBtn.click();
    setTimeout(expandThread, 500, postItemElem);
  };

  // Expand all button
  const attachExpandAllBtn = (postItemElem) => {
    const expandAllBtn = document.createElement("button");
    expandAllBtn.innerHTML = "展開所有回覆";
    expandAllBtn.className = "expand-all-btn plain-btn no-padding";
    expandAllBtn.addEventListener("click", () => {
      expandAllBtn.style.display = "none";
      expandThread(postItemElem);
    });
    getShowMoreBtn(postItemElem)?.insertAdjacentElement("afterend", expandAllBtn);
    postItemElem.addEventListener("expandDone", (e) =>
      filterThread(e.target, blockList),
    );
  };

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

  postContainerElem.addEventListener("contextmenu", (evt) => {
    if (evt.target.classList.contains("user-name")) {
      evt.preventDefault();
      menu.style.left = evt.pageX + "px";
      menu.style.top = evt.pageY - scrollY + "px";
      menu.style.display = "block";
      currentUserName = evt.target.textContent;
    }
  });

  postContainerElem.addEventListener("click", () => {
    menu.style.display = "";
  });
  menu.addEventListener("click", () => {
    menu.style.display = "";
  });

  rightContainerElem = document.querySelector(".right-container");

  function addToBlockList() {
    if (!currentUserName) {
      return;
    }
    blockList[currentUserName] = true;
    localStorage.setItem("blockList", JSON.stringify(blockList));
    currentUserName = "";
    filterAllThreads(blockList);
    refreshBlockList();
  }

  // Block list
  const blockListElem = document.createElement("div");
  blockListElem.className = "column-item";
  blockListElem.innerHTML = `
    <div class="section-title">已過濾使用者</div>
    <div class="column-item__content">
      <ul class="block-list"></ul>
    </div>
    <div class="section-title">介面自訂選項</div>
    <div class="column-item__content">
      <ul class="block-list"><input type='checkbox' name='useScroll'/>回應區使用捲軸</ul>
    </div>
  `;
  rightContainerElem.insertAdjacentElement("afterend", blockListElem);

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
        filterAllThreads(blockList);
        refreshBlockList();
      });
      li.appendChild(span);
      li.appendChild(button);
      ul.appendChild(li);
    });
  }
  function refreshUserOptions() {
    // Use scroll
    const useScrollCheckbox = blockListElem.querySelector("input[name='useScroll']");
    useScrollCheckbox.checked = userOptions.useScroll;
    useScrollCheckbox.addEventListener('change', (e) => {
      userOptions.useScroll = e.target.checked;
      console.log(userOptions.useScroll);
      localStorage.setItem("userOptions", JSON.stringify(userOptions));
      [...postItemElemList].forEach((elem) => setThreadScrollable(elem));
    });
  }

  // Styling
  function setThreadScrollable(postItemElem) {
    const replyAreaElem = postItemElem.querySelector('.p-3.border-top');
    replyAreaElem?.classList.toggle('scrollable-reply-area', userOptions.useScroll || false);
  }

  // Initialize
  const init = () => {
    function initPostItem(postItemElem) {
      attachExpandAllBtn(postItemElem);
      filterThread(postItemElem, blockList);
      setThreadScrollable(postItemElem);
    }
    refreshUserOptions();
    refreshBlockList();
    [...postItemElemList].forEach((elem) => initPostItem(elem));



    function logChanges(mutationList) {
      mutationList.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const postItemElem = mutation.addedNodes[0];
          if (postItemElem.classList?.contains("post-item")) {
            initPostItem(postItemElem);
          }
        }
      });
    }
    const observer = new MutationObserver(logChanges);
    observer.observe(postContainerElem, {
      childList: true,
      subtree: false,
    });
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
          font-size: .75rem;
      }
      .no-padding {
          padding: 0;
      }
      .scrollable-reply-area {
          overflow: auto;
          max-height: 750px;
      }
  `;
  document.head.appendChild(styleSheet);
}

if (window.location.href.includes("post_id=")) {
  run();
} else if (window.location.href.includes("club/index")) {
  run();
}
