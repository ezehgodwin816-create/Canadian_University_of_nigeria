AI PERFECT FIX
==============

Replace ALL three (important — old JS is still live on GitHub):

  js/ai-assistant.js
  css/style.css
  ai-assistant.html

What was wrong in your screenshot:
• "Hello" went to Wikipedia (treated as a topic, not a greeting)
• "Hi" hit the old "not yet made public" fallback
• Full Wikipedia URL was dumped as text
• No typing animation

What this version does:
1. hi / hello / hey → friendly greeting ONLY (never Wikipedia)
2. Animated typing dots (•••) while thinking
3. Web sources show a small chip: 🔗 Wikipedia (not the full URL)
4. "It's not yet made public." ONLY for missing CUN school facts
5. General questions still try the web when appropriate

After upload:
• Hard refresh or close the tab completely and reopen
• On phone: clear site data for github.io if it still looks old
