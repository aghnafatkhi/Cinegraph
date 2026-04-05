import { useEffect, useRef } from 'react';

export default function AdBanner() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    // Clear previous ad if any
    adRef.current.innerHTML = '';

    // Create script for atOptions
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '0a741259efa84453dba6c162b550fe06',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    // Create script for invoke.js
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/0a741259efa84453dba6c162b550fe06/invoke.js';

    adRef.current.appendChild(optionsScript);
    adRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="w-full flex justify-center py-12 px-4 overflow-hidden">
      <div 
        ref={adRef} 
        className="max-w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center min-h-[90px] min-w-[728px]"
      />
    </div>
  );
}
