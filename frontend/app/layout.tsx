import ChatButton from '@/components/ChatButton';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatButton />
      </body>
    </html>
  );
}
