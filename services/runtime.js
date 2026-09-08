/* Runtime guardrails shared by every surface. */
(function(){
  const cfg=window.CUN_CONFIG||{};
  window.CUNRuntime={
    isConfigured(){return !!(cfg.supabaseUrl&&cfg.supabaseAnonKey);},
    requireProduction(){if(!this.isConfigured()) throw new Error('This service is not configured for production yet.');},
    config:cfg
  };
})();
