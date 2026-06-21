'use strict';
/* Puente web de 3DTracker. Ya NO usa el servidor de Render:
   los datos viven en Firebase (Firestore) a través de window.DPCloud.
   Aquí solo quedan utilidades de navegación entre páginas. */
(function(){
  var SK = 'dp3-admin-shared';
  function waitCloud(){
    return new Promise(function(res){
      var w=0;
      (function c(){
        if(window.DPCloud){ (window.DPCloud.ready||Promise.resolve()).then(function(){res();}); }
        else if(w<9000){ w+=150; setTimeout(c,150); }
        else res();
      })();
    });
  }
  window.electronAPI = {
    getApiConfig: function(){ return waitCloud().then(function(){ return {}; }); },
    navigate: function(page){ window.location.href = page + '.html'; return Promise.resolve(); },
    setSharedData: function(data){ try{ sessionStorage.setItem(SK, JSON.stringify(data)); }catch(e){} return Promise.resolve(); },
    getSharedData: function(){ try{ return Promise.resolve(JSON.parse(sessionStorage.getItem(SK)) || {}); }catch(e){ return Promise.resolve({}); } }
  };
})();
