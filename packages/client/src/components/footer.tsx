import { FaDiscord , FaLinkedin , FaXTwitter } from 'react-icons/fa6';

import { Logo } from './ui/logo';

export const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="flex flex-col justify-between">
            {/* Top row with logo and legal links */}
            <div className="flex justify-between items-start mb-8">
              {/* TODO: Update to outline logo style when added to component library */}
              <Logo size="lg" color="white" />
              <ul className="text-lg underline font-rubik">
                {/* TODO: Update to use new privacy statement link when available */}
                <li className="mb-2">
                  <a
                    href="https://github.com/pocket-network/pocket-network"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Statement
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/pocket-network/pocket-network"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Copyright at bottom */}
            <div>© {new Date().getFullYear()} Pocket network. All rights reserved.</div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col items-center justify-between">
            {/* Social icons at top */}
            <div className="flex space-x-10 mb-8">
              <a
                href="https://discord.com/invite/pocket-network"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDiscord size={35} />
              </a>
              <a
                href="https://www.linkedin.com/company/pocket-network-foundation"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin size={35} />
              </a>
              <a href="https://x.com/POKTnetwork" target="_blank" rel="noopener noreferrer">
                <FaXTwitter size={35} />
              </a>
            </div>

            {/* TODO: Add navigation links at bottom */}
            <div className="flex gap-4 flex-wrap justify-center">
              <a href="https://forum.pokt.network/">Forum</a>
              <a href="https://poktscan.com/">Explorer</a>
              <a href="https://docs.pokt.network/">Docs</a>
              <a href="https://pocket.network/press-kit/">Press kit</a>
              <a href="https://github.com/pokt-network/pocket">GitHub</a>
              <a href="https://wallet.pokt.network/">Wallet</a>
              <a href="https://coinmarketcap.com/currencies/pocket-network/markets/">Buy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
