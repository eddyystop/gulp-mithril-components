/** @jsx m *///[component] selectCars [template] ./templates/selectAjax.js */
mc.selectCars = {
  controller : function (options) {
    options = options || {};
    this.value = typeof options.option === 'function' ? options.option() : options.option;

    this.onchange = function (e) {
      this.value = e.target.options[e.target.selectedIndex].value;
      if (typeof options.value === 'function') { options.value(this.value); }
      if (options.onclickTab) { options.onclickTab(this.value); }
      console.log('clicked', this.value);
    }.bind(this);
  },

  view : function (ctrl, options) {
    options = options || {};
    return m("select", {class:"form-control", onchange:ctrl.onchange}, [
  m("option", {selected:ctrl.value === 'tesla', value:"audi"}, ["Tesla Model S"]),
  m("option", {selected:ctrl.value === 'prius plugin', value:"tesla"}, ["Toyota Prius Plugin"]),
  m("option", {selected:ctrl.value === 'prius v', value:"volvo"}, ["Toyota Prius v"])
]);

  }
};