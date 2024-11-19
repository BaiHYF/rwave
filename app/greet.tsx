'use client'

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core'

export default function Greet() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    invoke<string>('greet', { name: 'Baihyf' })
      .then(result => setGreeting(result))
      .catch(console.error)
  }, [])

  // Necessary because we will have to use Greet as a component later.
  return <h2>{greeting}</h2>;
}