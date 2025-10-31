import React from 'react';
import { NavLink } from 'react-router-dom';
import { Github, Twitter, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Footer = () => {
	const currentYear = new Date().getFullYear();
	const { toast } = useToast();

	const handleDiscordClick = () => {
		toast({
			title: `🚧 Discord Server Coming Soon!`,
			description: "Our community server is being set up. Stay tuned for the invitation link! 🚀",
		});
	};

	return (
		<footer className="bg-black/50 border-t border-cyan-500/20 py-12 px-4">
			<div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
				<div className="md:col-span-1">
					<h3 className="text-2xl font-bold gradient-text mb-4">HYPERNODE</h3>
					<p className="text-gray-400 text-sm">
						Decentralized AI-Powered Computing Network
					</p>
				</div>
				<div>
					<h4 className="font-semibold text-lg text-cyan-400 mb-4">Company</h4>
					<ul className="space-y-3">
						<li>
							<NavLink to="/about" className="text-gray-300 hover:text-cyan-400 transition-colors">About</NavLink>
						</li>
						<li>
							<NavLink to="/technology" className="text-gray-300 hover:text-cyan-400 transition-colors">Technology</NavLink>
						</li>
						<li>
							<NavLink to="/economy" className="text-gray-300 hover:text-cyan-400 transition-colors">Economy</NavLink>
						</li>
					</ul>
				</div>
				<div>
					<h4 className="font-semibold text-lg text-cyan-400 mb-4">Resources</h4>
					<ul className="space-y-3">
						<li>
							<NavLink to="/developers" className="text-gray-300 hover:text-cyan-400 transition-colors">Developers</NavLink>
						</li>
						<li>
							<NavLink to="/community" className="text-gray-300 hover:text-cyan-400 transition-colors">Community</NavLink>
						</li>
						<li>
							<NavLink to="/contact" className="text-gray-300 hover:text-cyan-400 transition-colors">Contact</NavLink>
						</li>
					</ul>
				</div>
				<div>
					<h4 className="font-semibold text-lg text-cyan-400 mb-4">Connect</h4>
					<div className="flex space-x-2">
						<Button asChild variant="ghost" size="icon" className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10">
							<a href="https://x.com/hypernode_sol" target="_blank" rel="noopener noreferrer">
								<Twitter size={20} />
							</a>
						</Button>
						<Button asChild variant="ghost" size="icon" className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10">
							<a href="https://github.com/Hypernode-sol" target="_blank" rel="noopener noreferrer">
								<Github size={20} />
							</a>
						</Button>
						<Button variant="ghost" size="icon" className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={handleDiscordClick}>
							<MessageSquare size={20} />
						</Button>
					</div>
				</div>
			</div>
			<div className="mt-12 pt-8 border-t border-cyan-500/10 text-center text-gray-500 text-sm">
				<p>&copy; {currentYear} HYPERNODE. All rights reserved.</p>
			</div>
		</footer>
	);
};

export default Footer;