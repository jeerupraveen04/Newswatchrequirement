/* =========================================================================
   NewsWatch — Skeleton Prototype shared chrome + helpers
   Injects header / bottom tab bar / admin sidebar and wires interactions.
   Pages declare:  <body data-page="home" data-base="">
   ========================================================================= */

(function () {
  var body = document.body;
  var page = body.getAttribute("data-page") || "";
  var base = body.getAttribute("data-base") || "";

  function isActive(name) {
    return page === name ? "active" : "";
  }

  function header() {
    return (
      '<header class="app-header">' +
      '<a href="' + base + 'p07-home-feed.html" class="logo"><span class="logo-icon"></span><span>newswatch</span></a>' +
      '<nav class="desktop-nav">' +
      '<a href="' + base + 'p07-home-feed.html">Home</a>' +
      '<a href="' + base + 'p10-categories.html">Categories</a>' +
      '<a href="' + base + 'p17-notifications.html">Notifications</a>' +
      '<a href="' + base + 'p15-bookmarks.html">Bookmarks</a>' +
      '<a href="' + base + 'p21-about-static.html">About</a>' +
      '</nav>' +
      '<div class="header-actions">' +
      '<form class="search-box" action="' + base + 'p13-search-results.html">' +
      '<input type="text" placeholder="Search news..." name="q" />' +
      '<span>&#9906;</span></form>' +
      '<a class="btn btn-primary btn-login-desktop" href="' + base + 'p03-login.html">Login</a>' +
      '<a class="icon-link" href="' + base + 'p17-notifications.html" title="Notifications">&#128276;<span class="icon-badge">3</span></a>' +
      '<a class="icon-link" href="' + base + 'p18-profile.html" title="Profile">&#9787;</a>' +
      '<span class="mobile-icon">&#9906;</span>' +
      '<span class="mobile-icon" onclick="location.href=\'' + base + 's02-navigation-shell.html\'">&#8942;</span>' +
      '</div></header>'
    );
  }

  function tabbar() {
    var tabs = [
      ["home", "p07-home-feed.html", "&#8962;", "Home"],
      ["categories", "p10-categories.html", "&#9638;", "Categories"],
      ["search", "p12-search.html", "&#9906;", "Search"],
      ["bookmarks", "p15-bookmarks.html", "&#9873;", "Saved"],
      ["profile", "p18-profile.html", "&#9787;", "Profile"]
    ];
    var html = '<nav class="tabbar">';
    tabs.forEach(function (t) {
      html +=
        '<a href="' + base + t[1] + '" class="' + isActive(t[0]) + '">' +
        '<span class="t-ico">' + t[2] + '</span><span>' + t[3] + "</span></a>";
    });
    return html + "</nav>";
  }

  var adminItems = [
    ["dashboard", "a02-admin-dashboard.html", "Dashboard"],
    ["moderation", "a03-article-moderation.html", "Article Moderation"],
    ["categories", "a04-category-management.html", "Categories"],
    ["users", "a05-user-management.html", "Users"],
    ["approvals", "a06-reporter-approvals.html", "Reporter Approvals"],
    ["analytics", "a07-analytics.html", "Analytics"]
  ];

  var superItems = [
    ["regions", "a08-region-management.html", "Regions"],
    ["appsettings", "a09-app-settings-contacts.html", "App & Ad Settings"],
    ["danger", "a10-danger-zone.html", "Danger Zone"]
  ];

  function adminSide() {
    var superAdmin = body.getAttribute("data-super") === "true";
    var html =
      '<aside class="admin-side"><div class="brand">newswatch ' +
      (superAdmin ? "super admin" : "admin") +
      "</div>";
    adminItems.forEach(function (i) {
      html +=
        '<a href="' + base + i[1] + '" class="' + isActive(i[0]) + '">' +
        i[2] + "</a>";
    });
    if (superAdmin) {
      html +=
        '<div style="margin:18px 12px 8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#888">God mode</div>';
      superItems.forEach(function (i) {
        html +=
          '<a href="' + base + i[1] + '" class="' + isActive(i[0]) + '">' +
          i[2] + "</a>";
      });
    }
    html +=
      '<a href="' + base + 'a01-admin-login.html" style="margin-top:20px">Sign out</a></aside>';
    return html;
  }

  if (body.getAttribute("data-chrome") !== "none") {
    if (body.getAttribute("data-admin") === "true") {
      document.body.insertAdjacentHTML("afterbegin", adminSide());
      document.body.classList.add("admin-shell-active");
    } else {
      document.body.insertAdjacentHTML("afterbegin", header());
      if (body.getAttribute("data-app") === "true") {
        document.body.insertAdjacentHTML("beforeend", tabbar());
      }
    }
  }

  /* ---- interactions ---- */

  window.owToggle = function (el) {
    el.classList.toggle("active");
  };

  window.owLike = function (el) {
    el.classList.toggle("active");
    var n = el.querySelector(".count");
    if (n) {
      var v = parseFloat(n.textContent.replace(/[^0-9.]/g, "")) || 0;
      var hasK = /K/i.test(n.textContent);
      v = el.classList.contains("active") ? v + (hasK ? 0.1 : 1) : v - (hasK ? 0.1 : 1);
      n.textContent = hasK ? v.toFixed(1) + "K" : Math.round(v);
    }
  };

  window.owToast = function (msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText =
      "position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#171717;color:#fff;" +
      "padding:11px 18px;border-radius:8px;font-size:13px;z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,.2)";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  };

  /* Generic modal: owModal({ title, body (html), actions: [{label, primary, onClick}] }) */
  window.owModal = function (opts) {
    opts = opts || {};
    var overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1200;display:flex;align-items:center;" +
      "justify-content:center;padding:20px";
    var actionsHtml = (opts.actions || [])
      .map(function (a, i) {
        return (
          '<button class="btn ' +
          (a.primary ? "btn-primary" : "btn-secondary") +
          '" data-action="' + i + '">' + a.label + "</button>"
        );
      })
      .join("");
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;width:100%;max-width:' + (opts.width || "520px") +
      ';max-height:90vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.25)">' +
      '<div class="row-between" style="padding:18px 22px;border-bottom:1px solid var(--border)">' +
      '<b style="font-size:17px">' + (opts.title || "") + "</b>" +
      '<span style="cursor:pointer;font-size:20px;color:var(--muted)" data-close>&times;</span></div>' +
      '<div style="padding:22px">' + (opts.body || "") + "</div>" +
      (actionsHtml
        ? '<div class="row" style="padding:16px 22px;border-top:1px solid var(--border);justify-content:flex-end;gap:10px">' +
          actionsHtml + "</div>"
        : "") +
      "</div>";
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.hasAttribute("data-close")) close();
      var a = e.target.getAttribute && e.target.getAttribute("data-action");
      if (a != null && opts.actions && opts.actions[a]) {
        var fn = opts.actions[a].onClick;
        if (fn) fn(close);
        else close();
      }
    });
    window.owCloseModal = close;
    return overlay;
  };

  /* Quick publish modal used by the admin dashboard */
  window.owQuickPublish = function () {
    owModal({
      title: "Quick publish",
      body:
        '<div class="field"><label>Headline</label><input class="input" id="qpTitle" placeholder="Article headline" /></div>' +
        '<div class="field"><label>Summary</label><textarea class="textarea" placeholder="Short summary"></textarea></div>' +
        '<div class="field"><label>Region</label><div class="row wrap">' +
        '<select class="select" style="max-width:150px"><option>Telangana</option></select>' +
        '<select class="select" style="max-width:150px"><option>Hyderabad</option></select>' +
        '<select class="select" style="max-width:150px"><option>Secunderabad</option></select></div></div>' +
        '<div class="field"><label>Category</label><select class="select"><option>India</option><option>Sports</option><option>Business</option><option>Technology</option></select></div>' +
        "<p class=\"small muted\">Publishes immediately to your region and is audited.</p>",
      actions: [
        { label: "Cancel" },
        { label: "Publish now", primary: true, onClick: function (close) { close(); owToast("Article published"); } }
      ]
    });
  };

  /* Category create/edit modal used by A04 Category Management */
  window.owCategoryModal = function (data) {
    data = data || {};
    var editing = !!data.name;
    owModal({
      title: editing ? "Edit category" : "New category",
      body:
        '<div class="field"><label>Name</label><input class="input" id="catName" value="' +
        (data.name || "") + '" placeholder="e.g. Health" /></div>' +
        '<div class="field"><label>Slug</label><input class="input" value="' +
        (data.slug || "") + '" placeholder="health" /></div>' +
        '<div class="field"><label>Description</label><textarea class="textarea">' +
        (data.description || "") + "</textarea></div>" +
        '<div class="field"><label>Icon / image</label>' +
        '<div style="border:2px dashed var(--border);border-radius:12px;padding:22px;text-align:center;color:var(--muted);cursor:pointer" onclick="owFilePicker(\'image/*\',function(f){owToast(\'Selected: \'+f.name)});">Upload icon</div></div>' +
        '<div class="row"><span class="small muted">Active</span><span class="switch on" onclick="this.classList.toggle(\'on\')" style="width:44px;height:26px;border-radius:999px;background:var(--purple);position:relative;display:inline-block"></span></div>',
      actions: [
        { label: "Cancel" },
        {
          label: editing ? "Save changes" : "Create category",
          primary: true,
          onClick: function (close) { close(); owToast(editing ? "Category updated" : "Category created"); }
        }
      ]
    });
  };

  /* Hidden OS file picker. owFilePicker(accept, cb, multiple) */
  window.owFilePicker = function (accept, cb, multiple) {
    var inp = document.createElement("input");
    inp.type = "file";
    if (accept) inp.accept = accept;
    if (multiple) inp.multiple = true;
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.addEventListener("change", function () {
      var files = inp.files;
      if (files && files.length) {
        var names = [];
        for (var i = 0; i < files.length; i++) names.push(files[i].name);
        if (cb) cb(files, names);
        else owToast("Selected: " + names.join(", "));
      }
      inp.remove();
    });
    inp.click();
  };

  window.owConfirm = function (opts) {
    opts = opts || {};
    owModal({
      title: opts.title || "Are you sure?",
      body: '<p class="small" style="line-height:1.6">' + (opts.message || "") + "</p>",
      width: "440px",
      actions: [
        { label: opts.cancelLabel || "Cancel" },
        {
          label: opts.confirmLabel || "Confirm",
          primary: true,
          onClick: function (close) { close(); if (opts.onConfirm) opts.onConfirm(); }
        }
      ]
    });
  };

  /* Rejection dialog with required reason */
  window.owRejectModal = function (onDone) {
    owModal({
      title: "Reject article",
      body:
        '<div class="field"><label>Reason for rejection <span class="badge badge-error" style="margin-left:6px">Required</span></label>' +
        '<textarea class="textarea" id="rejReason" placeholder="Explain what the reporter must change..."></textarea>' +
        '<div class="hint">The reporter is notified by push and email.</div></div>',
      actions: [
        { label: "Cancel" },
        {
          label: "Send &amp; reject",
          primary: true,
          onClick: function (close) {
            var r = document.getElementById("rejReason").value.trim();
            if (!r) { owToast("Please enter a reason"); return; }
            close();
            owToast("Article rejected & reporter notified");
            if (onDone) onDone();
          }
        }
      ]
    });
  };

  window.owScheduleModal = function () {
    owModal({
      title: "Schedule publish",
      body:
        '<div class="field"><label>Publish date &amp; time</label><input class="input" type="datetime-local" id="schedAt" /></div>' +
        '<div class="field"><label>Region</label><select class="select"><option>My scope</option><option>Telangana</option><option>Hyderabad</option></select></div>',
      actions: [
        { label: "Cancel" },
        { label: "Schedule", primary: true, onClick: function (close) { close(); owToast("Publish scheduled"); } }
      ]
    });
  };

  window.owPreviewModal = function () {
    owModal({
      title: "Article preview",
      width: "640px",
      body:
        '<span class="badge badge-purple">India</span>' +
        '<h2 style="font-size:24px;font-weight:800;margin:12px 0 8px;line-height:1.22">PM Modi Inaugurates New Infrastructure Projects in Andhra Pradesh</h2>' +
        '<p style="color:var(--muted-strong);line-height:1.6">The Prime Minister laid the foundation stone for several infrastructure projects aimed at boosting connectivity and jobs.</p>' +
        '<p style="margin-top:12px;line-height:1.7;color:var(--text-secondary)">Officials said the projects are expected to improve connectivity and support economic activity across several districts of the state.</p>',
      actions: [
        { label: "Close" },
        { label: "Open full article", primary: true, onClick: function (close) { close(); location.href = "p09-article-detail.html"; } }
      ]
    });
  };

  window.owShareModal = function () {
    owModal({
      title: "Share",
      width: "460px",
      body:
        '<div class="row wrap">' +
        '<button class="btn btn-secondary" onclick="owToast(\'Shared to WhatsApp\')">WhatsApp</button>' +
        '<button class="btn btn-secondary" onclick="owToast(\'Shared to X\')">X</button>' +
        '<button class="btn btn-secondary" onclick="owToast(\'Shared to Facebook\')">Facebook</button>' +
        '<button class="btn btn-secondary" onclick="owShareLink()">Copy link</button>' +
        '<a class="btn btn-primary" href="r05-share-poster.html">Make poster</a>' +
        "</div>",
      actions: [{ label: "Close" }]
    });
  };

  window.owShareLink = function () {
    owToast("Link copied to clipboard");
  };

  window.owRoleModal = function (name, current) {
    owModal({
      title: "Change role \u2014 " + (name || "User"),
      body:
        '<div class="field"><label>Role</label><select class="select" id="roleSel">' +
        ["User", "Reporter", "Admin", "Super Admin"]
          .map(function (r) { return '<option' + (r === current ? " selected" : "") + ">" + r + "</option>"; })
          .join("") +
        "</select></div>" +
        '<div class="field"><label>Region scope (for Admin/Reporter)</label>' +
        '<select class="select"><option>None</option><option>Telangana</option><option>Hyderabad district</option><option>Secunderabad constituency</option></select></div>' +
        '<p class="small muted">Granting Admin/Super Admin requires typed confirmation in production.</p>',
      actions: [
        { label: "Cancel" },
        {
          label: "Save role",
          primary: true,
          onClick: function (close) {
            var v = document.getElementById("roleSel").value;
            close();
            owToast("Role changed to " + v);
          }
        }
      ]
    });
  };

  window.owUserModal = function (name, email, role) {
    owModal({
      title: name || "User profile",
      width: "560px",
      body:
        '<div class="row mb-2"><span class="avatar avatar-lg">' + ((name || "U")[0]) + "</span>" +
        "<div><b>" + (name || "") + '</b><div class="small muted">' + (email || "") + " &middot; " + (role || "User") + "</div></div></div>" +
        '<div class="grid grid-3 mb-2"><div class="kpi"><div class="num">24</div><div class="lbl">Articles</div></div>' +
        '<div class="kpi"><div class="num">81</div><div class="lbl">Comments</div></div>' +
        '<div class="kpi"><div class="num">2</div><div class="lbl">Reports</div></div></div>' +
        '<div class="row wrap"><span class="badge badge-success">Active</span><span class="badge badge-muted">Joined 2mo ago</span></div>',
      actions: [
        { label: "Close" },
        { label: "Message", primary: true, onClick: function (close) { close(); owToast("Message composer opened"); } }
      ]
    });
  };

  window.owScopeModal = function (who) {
    owModal({
      title: "Region scope \u2014 " + (who || "user"),
      body:
        '<div class="field"><label>Assign regions</label><div class="row wrap">' +
        '<button class="chip active">Telangana</button><button class="chip">Hyderabad</button>' +
        '<button class="chip active">Secunderabad</button><button class="chip">Bowenpally</button></div>' +
        '<div class="hint mt-1">Selected regions and their descendants become this user\u2019s scope.</div></div>',
      actions: [
        { label: "Cancel" },
        { label: "Save scope", primary: true, onClick: function (close) { close(); owToast("Region scope updated"); } }
      ]
    });
  };

  window.owRegionModal = function (data) {
    data = data || {};
    owModal({
      title: data.name ? "Edit region" : "New region",
      body:
        '<div class="field"><label>Name</label><input class="input" value="' + (data.name || "") + '" placeholder="e.g. Warangal" /></div>' +
        '<div class="field"><label>Type</label><select class="select">' +
        ["State", "District", "Constituency", "Mandal"].map(function (t) { return "<option>" + t + "</option>"; }).join("") +
        "</select></div>" +
        '<div class="field"><label>Parent region</label><select class="select"><option>None</option><option>Telangana</option><option>Hyderabad</option><option>Secunderabad</option></select></div>',
      actions: [
        { label: "Cancel" },
        { label: data.name ? "Save changes" : "Create region", primary: true, onClick: function (close) { close(); owToast(data.name ? "Region updated" : "Region created"); } }
      ]
    });
  };

  window.owDateRangeModal = function () {
    owModal({
      title: "Date range",
      width: "460px",
      body:
        '<div class="row"><div class="field" style="flex:1"><label>From</label><input class="input" type="date" /></div>' +
        '<div class="field" style="flex:1"><label>To</label><input class="input" type="date" /></div></div>' +
        '<div class="row wrap"><button class="chip">Today</button><button class="chip">7 days</button><button class="chip">30 days</button></div>',
      actions: [
        { label: "Cancel" },
        { label: "Apply", primary: true, onClick: function (close) { close(); owToast("Date range applied"); } }
      ]
    });
  };

  window.owSamplesModal = function () {
    owModal({
      title: "Sample articles",
      width: "520px",
      body:
        '<div class="list-row"><div class="grow"><div class="title">State Budget 2026 Explained</div><div class="sub">sample url</div></div><a class="btn btn-ghost btn-sm" href="p09-article-detail.html">Open</a></div>' +
        '<div class="list-row"><div class="grow"><div class="title">Metro Phase 3 Approved</div><div class="sub">sample url</div></div><a class="btn btn-ghost btn-sm" href="p09-article-detail.html">Open</a></div>',
      actions: [{ label: "Close" }]
    });
  };

  window.owSubmit = function (e) {
    if (e) e.preventDefault();
    owToast("Demo only — no backend connected");
    return false;
  };
})();
