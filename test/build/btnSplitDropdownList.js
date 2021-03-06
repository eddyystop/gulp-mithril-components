/** @jsx m *///[component] btnSplitDropdownList [template] ./templates/btnDropdown.js */
/*global m:false */

// ctrl: <props> _isDropdownOpen, _dropdownId <events> _onclickTab, onClickDropdown
// options: label, isDisabled, isActive, classes, dropdown[]
// dropdown[]: <props> label, isActive, isDisabled, redirectTo <events> _onclickTab
// classes: btn-default -primary -success -info -warning -danger -link
// classes: btn-lg -sm -xs
// classes: btn-block

mc.btnSplitDropdownList = function (ctrl, options) {
  options = options || {};
  options.label = options.label || options.name;

  if (ctrl._dropdownId !== mc._comm.lastDropdownId) { ctrl.closeDropdown(); }

  return m("div", {class:'btn-group' + classMain() }, [
  m("button", {class:"btn btn-primary", type:"button", onclick: ctrl._onclickDropdown }, [ options.label,  " " ]),
  m("button", {class:"btn btn-primary dropdown-toggle", type:"button", onclick: ctrl._onclickDropdown }, [
    m("span", {class:"caret"}),
    m("span", {class:"sr-only"}, ["Toggle dropdown"])
  ])
 , displayMenuList() 
]);

  function displayMenu () {
    return ;
  }

  function classMain () {
    return (options.classes || '' ) +
      (ctrl._isDropdownOpen ? ' open' : '') +
      (options.isDisabled ? ' disabled' : '') +
      (options.isActive ? ' active' : '');
  }

  function displayMenuList () {
    if (!ctrl._isDropdownOpen) { return null; }

    return m('ul.dropdown-menu' + (options.dropdown.alignRight ? '.dropdown-menu-right' : ''),
      options.dropdown.map(function (menuItem) {

        switch (menuItem.type) {
          case 'divider':
            return m('li.divider', {style:{margin: '6px 0px'}}, ''); // .divider's 9px is not visible; px in 0px req'd for tests
          case 'header':
            return m('li.dropdown-header', {tabindex: '-1'}, menuItem.label || menuItem.name);
          default:
            return viewTab(
              mc.utils.extend({}, menuItem, { isActive: false, _onclickTab: ctrl._onclickTab })
            );
        }
      })
    );
  }

  function viewTab (ctrl) {
    var href = '',
      attr = {};

    if (!ctrl.isDisabled) {
      if (ctrl.redirectTo) {
        href = '[href="' + ctrl.redirectTo + '"]';
        attr = {config : m.route};
      } else {
        attr = {onclick : ctrl._onclickTab.bind(this, ctrl.name)};
      }
    }

    return m('li' + (ctrl.isActive ? '.active' : '') + (ctrl.isDisabled ? '.disabled' : ''),
      m('a' + href, attr, ctrl.label || ctrl.name || '')
    );
  }
};