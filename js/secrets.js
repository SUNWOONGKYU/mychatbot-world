const MCW_SECRETS = {
    OPENROUTER_API_KEY: "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",
    SUPABASE_URL: "https://gybgkehtonqhosuutoxx.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YmdrZWh0b25xaG9zdXV0b3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzQ1OTEsImV4cCI6MjA4Njc1MDU5MX0.Xk4JRkJwdTps95vXq3dXklgsTl7Yz_G1I4kbItPr2kw"
};

// Also save to localStorage for the app to use
if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mcw_openrouter_key', MCW_SECRETS.OPENROUTER_API_KEY);
    console.log("[SECRETS] API Key Loaded from secrets.js");
}
