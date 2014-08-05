/*global m:false */
// Dropdown ====================================================================
mc = mc || {};

// options: <props> tabName() <event> onclickTab
mc.DropdownCtrl = function (options) {
  options = options || {};
  this._isDropdownOpen = false;
  this._dropdownId = 0;

  this._onclickTab = function (name) {
    console.log('onclickTab')
    this._isDropdownOpen = false;
    mc._comm.lastDropdownId = -1; // will force closed any open dropdowns
    if (typeof options.tabName === 'function') { options.tabName(name); }
    if (options.onclickTab) { options.onclickTab(name); }
  }.bind(this);

  this._onclickDropdown = function () {
    console.log('onclickDropDown')
    this._isDropdownOpen = !this._isDropdownOpen;
    mc._comm.lastDropdownId = this._dropdownId = Date.now();
  }.bind(this);

  this.closeDropdown = function () {
    this._isDropdownOpen = false;
  }.bind(this);
};
