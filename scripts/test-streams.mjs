async function test() {
  try {
    const res = await fetch('https://iptv-org.github.io/iptv/categories/sport.m3u');
    const txt = await res.text();
    const lines = txt.split('\n');
    const sports = [];
    let current = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF')) {
        current = { info: line };
      } else if (line.startsWith('http') && current) {
        current.url = line;
        const info = current.info;
        if (
          info.includes('Abu Dhabi') ||
          info.includes('Dubai') ||
          info.includes('Sharjah') ||
          info.includes('KSA') ||
          info.includes('Saudi') ||
          info.includes('beIN') ||
          info.includes('Alkass') ||
          info.includes('OnTime') ||
          info.includes('Arryadia') ||
          info.includes('Red Bull')
        ) {
          sports.push(current);
        }
        current = null;
      }
    }

    console.log(`Found ${sports.length} candidate streams:`);
    for (const s of sports.slice(0, 10)) {
      console.log('Stream:', s.info);
      console.log('URL:', s.url);
      try {
        const testRes = await fetch(s.url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        console.log('Status:', testRes.status);
      } catch (e) {
        console.log('Test failed:', e.message);
      }
      console.log('---');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
