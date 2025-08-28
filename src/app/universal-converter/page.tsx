   const response = await fetch('http://localhost:8000/api/convert', {
   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/convert`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ value: numericValue, category, fromUnit, toUnit }),

