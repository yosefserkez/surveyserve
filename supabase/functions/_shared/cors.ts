export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

// List of allowed origins - add your custom domains here
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://surveyserve.netlify.app',
  'https://surveyserve.vercel.app',
  'https://surveyserve.com',
  'https://www.surveyserve.com',
];

export function handleCors(request: Request): Response | Record<string, string> {
  const origin = request.headers.get('origin');
  
  // Check if origin is in allowed list or if we're allowing all (for development)
  const isAllowedOrigin = allowedOrigins.includes(origin || '') || allowedOrigins.includes('*');
  
  const headers = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : allowedOrigins[0],
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }
  
  return headers;
}

export function createResponse(data: any, status = 200, request?: Request) {
  const corsResult = request ? handleCors(request) : corsHeaders;
  const headers = corsResult instanceof Response ? corsHeaders : corsResult;
  
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}