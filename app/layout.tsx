import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Lax's CNC — Dịch & mô phỏng G-code",
  description:
    "Ứng dụng cá nhân để đọc, kiểm tra, đo kích thước và mô phỏng đường chạy dao CNC từ file G-code.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                Object.defineProperty(window, 'fetch', {
                  value: window.fetch,
                  writable: true,
                  configurable: true,
                  enumerable: true
                });
              } catch(e) {}
              
              try {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('Cannot set property fetch')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
                
                var originalConsoleError = console.error;
                console.error = function() {
                  var args = Array.prototype.slice.call(arguments);
                  if (args[0] && typeof args[0] === 'string') {
                    if (args[0].includes('A tree hydrated but some attributes of the server rendered HTML didn\\'t match') ||
                        args[0].includes('Hydration failed because the initial UI does not match') ||
                        args[0].includes('There was an error while hydrating') ||
                        args[0].includes('Cannot set property fetch of #<Window>')) {
                      return;
                    }
                  }
                  originalConsoleError.apply(console, args);
                };
                
                var observer = new MutationObserver(function() {
                  if (document.body) {
                    var attrs = document.body.attributes;
                    for (var i = attrs.length - 1; i >= 0; i--) {
                      var name = attrs[i].name;
                      if (name.startsWith('bis_') || name.startsWith('__processed_')) {
                        document.body.removeAttribute(name);
                      }
                    }
                  }
                });
                observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
                window.addEventListener('DOMContentLoaded', function() { observer.disconnect(); });
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
