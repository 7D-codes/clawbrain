export const metadata = {
  title: 'ClawBrain - Command Center',
  description: 'Your AI second brain dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          * { box-sizing: border-box; }
          body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f; 
            color: #e4e4e7;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
