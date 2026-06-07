export const metadata = {
  title: "Knox Creative",
  description: "Real estate photography & marketing · Athens, TN",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
