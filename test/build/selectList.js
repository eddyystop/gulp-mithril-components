/** @jsx m *///[component] selectList [template] ./templates/selectAjax.js */
mc.selectList = {
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
    return m("select", {class:"form-control", onchange: ctrl.onchange }, [
   options.items.map(function (item) { 
   return m("option", {disabled:item.disabled}, [ item.name ]);
   }) 
]);

  }
};