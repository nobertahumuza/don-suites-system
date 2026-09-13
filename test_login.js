async function test() {
  const loginRes = await fetch('https://system-next.vercel.app/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username: 'admin', password: 'admin123'})
  });
  
  const cookie = loginRes.headers.get('set-cookie');
  
  // Try a simpler page first - rooms
  const roomsRes = await fetch('https://system-next.vercel.app/rooms', {
    headers: {Cookie: cookie || ''}
  });
  console.log('Rooms status:', roomsRes.status);
  
  // Try fb/orders  
  const fbRes = await fetch('https://system-next.vercel.app/fb/orders', {
    headers: {Cookie: cookie || ''}
  });
  console.log('F&B Orders status:', fbRes.status);

  // Try staff
  const staffRes = await fetch('https://system-next.vercel.app/staff', {
    headers: {Cookie: cookie || ''}
  });
  console.log('Staff status:', staffRes.status);
  
  // Try profile
  const profileRes = await fetch('https://system-next.vercel.app/profile', {
    headers: {Cookie: cookie || ''}
  });
  console.log('Profile status:', profileRes.status);
}

test().catch(console.error);
