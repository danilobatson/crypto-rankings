'use client';

import { useState } from 'react';
import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as Select from '@radix-ui/react-select';
import * as Toast from '@radix-ui/react-toast';
import {
	ChevronDownIcon,
	ReloadIcon,
	ActivityLogIcon,
	RocketIcon,
	CheckCircledIcon,
	ExclamationTriangleIcon,
	InfoCircledIcon,
	LightningBoltIcon,
	BarChartIcon,
	GearIcon,
	PlayIcon,
	GitHubLogoIcon,
	ExternalLinkIcon,
	StarIcon,
} from '@radix-ui/react-icons';

// Create a client with optimized settings
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchInterval: 5 * 60 * 1000, // 5 minutes
			retry: 3,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
	},
});

interface CryptoItem {
	Name: string;
	Symbol: string;
	Value: string;
	Sort: string;
}

interface MetricData {
	name: string;
	priority: string;
	description: string;
	success: boolean;
	data_count: number;
	all_data: CryptoItem[];
	top_3_preview: CryptoItem[];
	fetch_time_ms: number;
	error?: string;
}

interface ApiResponse {
	timestamp: string;
	total_metrics: number;
	all_metrics: { [key: string]: MetricData };
	fetch_stats: {
		total_duration_ms: number;
		successful_fetches: number;
		failed_fetches: number;
		last_update: string;
	};
}

// Enhanced metric options with better categorization and descriptions
const METRIC_OPTIONS = [
	{
		value: 'market_cap',
		label: 'Market Cap',
		description: 'Total dollar value of all coins in circulation',
		icon: '💰',
		category: 'Market',
		explanation: 'Shows which cryptocurrencies have the highest total value',
	},
	{
		value: 'price',
		label: 'Price',
		description: 'Current USD price per coin',
		icon: '💵',
		category: 'Market',
		explanation: 'Current trading price in US dollars',
	},
	{
		value: 'volume_24h',
		label: '24h Volume',
		description: 'Total trading volume in last 24 hours',
		icon: '📊',
		category: 'Market',
		explanation: 'How much trading activity happened recently',
	},
	{
		value: 'alt_rank',
		label: 'AltRank™',
		description: 'LunarCrush performance ranking algorithm',
		icon: '🏆',
		category: 'Performance',
		explanation: 'Proprietary ranking based on social and market metrics',
	},
	{
		value: 'interactions',
		label: 'Social Interactions',
		description: 'Total social media engagements',
		icon: '💬',
		category: 'Social',
		explanation: 'Likes, shares, comments across social platforms',
	},
	{
		value: 'percent_change_24h',
		label: '24h Change',
		description: 'Price change in last 24 hours',
		icon: '📈',
		category: 'Performance',
		explanation: 'Percentage price movement (positive or negative)',
	},
	{
		value: 'percent_change_7d',
		label: '7d Change',
		description: 'Price change in last 7 days',
		icon: '📅',
		category: 'Performance',
		explanation: 'Weekly price movement trend',
	},
	{
		value: 'social_dominance',
		label: 'Social Dominance',
		description: 'Share of total crypto social volume',
		icon: '🌐',
		category: 'Social',
		explanation: 'How much social attention this crypto gets',
	},
	{
		value: 'market_dominance',
		label: 'Market Dominance',
		description: 'Share of total crypto market cap',
		icon: '🎯',
		category: 'Market',
		explanation: 'Percentage of total cryptocurrency market',
	},
	{
		value: 'circulating_supply',
		label: 'Circulating Supply',
		description: 'Number of coins currently in circulation',
		icon: '🔄',
		category: 'Supply',
		explanation: 'How many coins are available for trading',
	},
	{
		value: 'percent_change_1h',
		label: '1h Change',
		description: 'Price change in last hour',
		icon: '⚡',
		category: 'Performance',
		explanation: 'Very recent price movement',
	},
];

// Custom hooks for data fetching with better error handling
const useCryptoData = () => {
	return useQuery({
		queryKey: ['cryptoData'],
		queryFn: async (): Promise<ApiResponse> => {
			const API_BASE_URL =
				process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
			const response = await fetch(`${API_BASE_URL}/api/crypto/data`);
			if (!response.ok) {
				throw new Error(
					`API Error: ${response.status} - ${response.statusText}`
				);
			}
			return response.json();
		},
		meta: {
			errorMessage: 'Failed to fetch cryptocurrency data',
		},
	});
};

// Enhanced Toast component with better styling
function ToastComponent({
	open,
	onOpenChange,
	title,
	description,
	type,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	type: 'success' | 'error' | 'info';
}) {
	const getIcon = () => {
		switch (type) {
			case 'success':
				return <CheckCircledIcon className='w-4 h-4 text-green-600' />;
			case 'error':
				return <ExclamationTriangleIcon className='w-4 h-4 text-red-600' />;
			case 'info':
				return <InfoCircledIcon className='w-4 h-4 text-blue-600' />;
		}
	};

	return (
		<Toast.Root open={open} onOpenChange={onOpenChange} className='toast-root'>
			<Toast.Title className='toast-title'>
				{getIcon()}
				{title}
			</Toast.Title>
			<Toast.Description className='toast-description'>
				{description}
			</Toast.Description>
			<Toast.Close className='toast-close'>×</Toast.Close>
		</Toast.Root>
	);
}

// Footer Component
function Footer() {
	return (
		<footer
			style={{
				background: 'var(--navy-900)',
				color: 'white',
				marginTop: '4rem',
				padding: '3rem 0 2rem',
				position: 'relative',
				overflow: 'hidden',
			}}>
			{/* Background pattern */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundImage:
						'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
					opacity: 0.1,
				}}
			/>

			<div className='container' style={{ position: 'relative', zIndex: 1 }}>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
						gap: '3rem',
						marginBottom: '2rem',
					}}>
					{/* Project Info */}
					<div>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.75rem',
								marginBottom: '1rem',
							}}>
							<div
								style={{
									width: '2.5rem',
									height: '2.5rem',
									background: 'var(--gradient-primary)',
									borderRadius: '0.5rem',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '1.25rem',
								}}>
								₿
							</div>
							<h3
								style={{
									fontSize: '1.25rem',
									fontWeight: 'var(--font-weight-bold)',
									margin: 0,
								}}>
								Crypto Analytics Dashboard
							</h3>
						</div>
						<p
							style={{
								color: 'rgba(255, 255, 255, 0.8)',
								lineHeight: '1.6',
								marginBottom: '1.5rem',
							}}>
							A modern cryptocurrency analytics platform showcasing real-time
							social sentiment and market data through an enterprise-grade
							technology stack.
						</p>

						{/* Tech Stack Badges */}
						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: '0.5rem',
							}}>
							{[
								'Go',
								'React',
								'TypeScript',
								'Inngest',
								'Redis',
								'LunarCrush',
							].map((tech) => (
								<span
									key={tech}
									style={{
										padding: '0.25rem 0.75rem',
										background: 'rgba(255, 255, 255, 0.1)',
										borderRadius: '1rem',
										fontSize: '0.75rem',
										fontWeight: 'var(--font-weight-medium)',
										border: '1px solid rgba(255, 255, 255, 0.2)',
									}}>
									{tech}
								</span>
							))}
						</div>
					</div>

					{/* Architecture */}
					<div>
						<h4
							style={{
								fontSize: '1rem',
								fontWeight: 'var(--font-weight-semibold)',
								marginBottom: '1rem',
								color: 'white',
							}}>
							🏗️ Architecture
						</h4>
						<ul
							style={{
								listStyle: 'none',
								padding: 0,
								margin: 0,
								display: 'flex',
								flexDirection: 'column',
								gap: '0.75rem',
							}}>
							{[
								{ name: 'LunarCrush MCP', desc: 'AI-ready social data access' },
								{
									name: 'Inngest Processing',
									desc: 'Background job orchestration',
								},
								{ name: 'Redis Caching', desc: 'High-performance data layer' },
								{ name: 'Go API', desc: 'Lightning-fast backend' },
							].map((item) => (
								<li
									key={item.name}
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '0.25rem',
									}}>
									<span
										style={{
											fontWeight: 'var(--font-weight-medium)',
											color: 'var(--cyan-400)',
										}}>
										{item.name}
									</span>
									<span
										style={{
											fontSize: '0.875rem',
											color: 'rgba(255, 255, 255, 0.7)',
										}}>
										{item.desc}
									</span>
								</li>
							))}
						</ul>
					</div>

					{/* Features & Links */}
					<div>
						<h4
							style={{
								fontSize: '1rem',
								fontWeight: 'var(--font-weight-semibold)',
								marginBottom: '1rem',
								color: 'white',
							}}>
							🚀 Features & Links
						</h4>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem',
							}}>
							{/* Key Features */}
							<div>
								<h5
									style={{
										fontSize: '0.875rem',
										fontWeight: 'var(--font-weight-medium)',
										marginBottom: '0.5rem',
										color: 'var(--blue-400)',
									}}>
									Key Features
								</h5>
								<ul
									style={{
										listStyle: 'none',
										padding: 0,
										margin: 0,
										fontSize: '0.875rem',
										color: 'rgba(255, 255, 255, 0.8)',
										display: 'flex',
										flexDirection: 'column',
										gap: '0.25rem',
									}}>
									<li>• Real-time social sentiment analysis</li>
									<li>• 11 cryptocurrency metrics</li>
									<li>• Background job processing</li>
									<li>• Modern responsive design</li>
								</ul>
							</div>

							{/* External Links */}
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '0.5rem',
								}}>
								<a
									href='https://github.com/yourusername/crypto-analytics'
									target='_blank'
									rel='noopener noreferrer'
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										color: 'var(--cyan-400)',
										textDecoration: 'none',
										fontSize: '0.875rem',
										fontWeight: 'var(--font-weight-medium)',
										transition: 'color 0.2s ease',
									}}
									onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
									onMouseLeave={(e) =>
										(e.currentTarget.style.color = 'var(--cyan-400)')
									}>
									<GitHubLogoIcon className='w-4 h-4' />
									View Source Code
									<ExternalLinkIcon className='w-3 h-3' />
								</a>

								<a
									href='https://lunarcrush.com'
									target='_blank'
									rel='noopener noreferrer'
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										color: 'var(--purple-400)',
										textDecoration: 'none',
										fontSize: '0.875rem',
										fontWeight: 'var(--font-weight-medium)',
										transition: 'color 0.2s ease',
									}}
									onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
									onMouseLeave={(e) =>
										(e.currentTarget.style.color = 'var(--purple-400)')
									}>
									<RocketIcon className='w-4 h-4' />
									LunarCrush API
									<ExternalLinkIcon className='w-3 h-3' />
								</a>

								<a
									href='https://inngest.com'
									target='_blank'
									rel='noopener noreferrer'
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										color: 'var(--blue-400)',
										textDecoration: 'none',
										fontSize: '0.875rem',
										fontWeight: 'var(--font-weight-medium)',
										transition: 'color 0.2s ease',
									}}
									onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
									onMouseLeave={(e) =>
										(e.currentTarget.style.color = 'var(--blue-400)')
									}>
									<LightningBoltIcon className='w-4 h-4' />
									Powered by Inngest
									<ExternalLinkIcon className='w-3 h-3' />
								</a>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div
					style={{
						borderTop: '1px solid rgba(255, 255, 255, 0.1)',
						paddingTop: '2rem',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: '1rem',
					}}>
					<div
						style={{
							fontSize: '0.875rem',
							color: 'rgba(255, 255, 255, 0.6)',
						}}>
						© 2025 Crypto Analytics Dashboard. Built for demonstration purposes.
					</div>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '1rem',
							fontSize: '0.875rem',
							color: 'rgba(255, 255, 255, 0.6)',
						}}>
						<span>Built with ❤️ using modern tech stack</span>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.25rem',
							}}>
							<StarIcon className='w-4 h-4 text-yellow-400' />
							<span>Inngest Interview Project</span>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

// Main dashboard component with enhanced UX
function CryptoDashboard() {
	const [selectedMetric, setSelectedMetric] = useState('market_cap');
	const [toastOpen, setToastOpen] = useState(false);
	const [toastMessage, setToastMessage] = useState({
		title: '',
		description: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

	const { data, isLoading, error, refetch, isRefetching } = useCryptoData();

	const triggerManualFetch = async () => {
		try {
			const API_BASE_URL =
				process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
			const response = await fetch(`${API_BASE_URL}/dev/trigger`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});

			if (response.ok) {
				setToastMessage({
					title: 'Data fetch triggered',
					description: 'Fresh data will be available in ~30 seconds',
					type: 'success',
				});
				setToastOpen(true);

				// Refetch after a delay
				setTimeout(() => {
					refetch();
				}, 2000);
			} else {
				throw new Error('Failed to trigger fetch');
			}
		} catch (err) {
			setToastMessage({
				title: 'Trigger failed',
				description: `Unable to trigger manual data fetch: ${err}`,
				type: 'error',
			});
			setToastOpen(true);
		}
	};

	const selectedMetricOption =
		METRIC_OPTIONS.find((opt) => opt.value === selectedMetric) ||
		METRIC_OPTIONS[0];
	const currentMetricData = data?.all_metrics?.[selectedMetric];

	const formatLastUpdate = (timestamp: string) => {
		try {
			return new Date(timestamp).toLocaleString();
		} catch {
			return 'Unknown';
		}
	};

	if (isLoading) {
		return (
			<div className='app-container'>
				<div className='loading-container'>
					<div className='loading-spinner'></div>
					<h2 className='loading-text'>Loading Crypto Analytics...</h2>
					<p className='loading-subtext'>
						Fetching real-time social sentiment and market data
					</p>
				</div>
			</div>
		);
	}

	return (
		<Toast.Provider swipeDirection='right'>
			<div className='app-container'>
				{/* Hero Header */}
				<div className='hero-header animate-fade-in'>
					<div className='hero-content'>
						<h1 className='hero-title'>Crypto Analytics Dashboard</h1>
						<p className='hero-subtitle'>
							Real-time cryptocurrency social sentiment and market data powered
							by cutting-edge technology
						</p>

						{/* Fixed tech badges - removed misleading hover effects */}
						<div className='hero-badges'>
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.5rem 1rem',
									background: 'rgba(255, 255, 255, 0.15)',
									border: '1px solid rgba(255, 255, 255, 0.3)',
									borderRadius: 'var(--radius-lg)',
									fontSize: '0.875rem',
									fontWeight: 'var(--font-weight-medium)',
									backdropFilter: 'blur(10px)',
								}}>
								<RocketIcon className='w-4 h-4' />
								LunarCrush MCP
							</div>
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.5rem 1rem',
									background: 'rgba(255, 255, 255, 0.15)',
									border: '1px solid rgba(255, 255, 255, 0.3)',
									borderRadius: 'var(--radius-lg)',
									fontSize: '0.875rem',
									fontWeight: 'var(--font-weight-medium)',
									backdropFilter: 'blur(10px)',
								}}>
								<GearIcon className='w-4 h-4' />
								Inngest Jobs
							</div>
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.5rem 1rem',
									background: 'rgba(255, 255, 255, 0.15)',
									border: '1px solid rgba(255, 255, 255, 0.3)',
									borderRadius: 'var(--radius-lg)',
									fontSize: '0.875rem',
									fontWeight: 'var(--font-weight-medium)',
									backdropFilter: 'blur(10px)',
								}}>
								<BarChartIcon className='w-4 h-4' />
								Go + Redis
							</div>
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.5rem 1rem',
									background: 'rgba(255, 255, 255, 0.15)',
									border: '1px solid rgba(255, 255, 255, 0.3)',
									borderRadius: 'var(--radius-lg)',
									fontSize: '0.875rem',
									fontWeight: 'var(--font-weight-medium)',
									backdropFilter: 'blur(10px)',
								}}>
								<LightningBoltIcon className='w-4 h-4' />
								Real-time Data
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='main-content'>
					<div className='container'>
						{/* Architecture Overview */}
						<div className='architecture-section animate-slide-left'>
							<div className='section-header'>
								<h2 className='section-title'>How It Works</h2>
								<p className='section-subtitle'>
									Enterprise-grade data pipeline showcasing modern architecture
									patterns
								</p>
							</div>

							<div className='architecture-flow'>
								<div className='flow-step'>
									<div className='flow-step-icon'>🌐</div>
									<h3 className='flow-step-title'>LunarCrush MCP</h3>
									<p className='flow-step-description'>
										Model Context Protocol provides AI-ready access to real-time
										social sentiment data
									</p>
								</div>

								<div className='flow-step'>
									<div className='flow-step-icon'>⚡</div>
									<h3 className='flow-step-title'>Inngest Processing</h3>
									<p className='flow-step-description'>
										Background jobs handle data fetching, processing, and error
										recovery automatically
									</p>
								</div>

								<div className='flow-step'>
									<div className='flow-step-icon'>🔄</div>
									<h3 className='flow-step-title'>Redis Caching</h3>
									<p className='flow-step-description'>
										High-performance caching ensures fast response times and
										reduces API load
									</p>
								</div>

								<div className='flow-step'>
									<div className='flow-step-icon'>🚀</div>
									<h3 className='flow-step-title'>Go API</h3>
									<p className='flow-step-description'>
										Lightning-fast Go backend serves clean, typed data to the
										React frontend
									</p>
								</div>
							</div>
						</div>

						{error ? (
							<div className='error-container animate-fade-in'>
								<div className='error-icon'>
									<ExclamationTriangleIcon />
								</div>
								<h3 className='error-title'>Unable to load data</h3>
								<p className='error-message'>{(error as Error).message}</p>
								<button onClick={() => refetch()} className='btn btn-primary'>
									<ReloadIcon className='w-4 h-4' />
									Try again
								</button>
							</div>
						) : (
							<div className='dashboard-section animate-slide-right'>
								{/* Control Panel */}
								<div className='control-panel'>
									<div className='control-panel-header'>
										<div className='control-panel-icon'>
											<BarChartIcon />
										</div>
										<div>
											<div className='control-panel-title'>Metric Selector</div>
										</div>
									</div>

									<div className='metric-selector-wrapper'>
										<div className='metric-label'>Choose Analysis Type</div>
										<div className='metric-description'>
											Select a metric to view the top 10 cryptocurrencies ranked
											by that criteria. Each metric provides unique insights
											into market performance and social sentiment.
										</div>

										{/* Fixed Select Component */}
										<Select.Root
											value={selectedMetric}
											onValueChange={setSelectedMetric}>
											<Select.Trigger
												className='select-trigger'
												style={{ cursor: 'pointer' }}>
												<div className='select-content-wrapper'>
													<span className='select-emoji'>
														{selectedMetricOption.icon}
													</span>
													<div className='select-text-content'>
														<div className='select-main-text'>
															{selectedMetricOption.label}
														</div>
														<div className='select-sub-text'>
															{selectedMetricOption.description}
														</div>
													</div>
												</div>
												<Select.Icon>
													<ChevronDownIcon
														style={{ width: '1rem', height: '1rem' }}
													/>
												</Select.Icon>
											</Select.Trigger>

											<Select.Portal>
												<Select.Content
													className='dropdown-content'
													position='popper'
													side='bottom'
													align='start'
													sideOffset={5}
													style={{
														background: 'white',
														border: '1px solid var(--navy-200)',
														borderRadius: 'var(--radius-lg)',
														boxShadow: 'var(--shadow-xl)',
														padding: '0.5rem',
														maxHeight: '20rem',
														overflowY: 'auto',
														zIndex: 1000,
														width: 'var(--radix-select-trigger-width)',
														maxWidth: '95vw',
													}}>
													<Select.Viewport>
														{METRIC_OPTIONS.map((option) => (
															<Select.Item
																key={option.value}
																value={option.value}
																className='dropdown-item'
																style={{
																	padding: '0.75rem',
																	borderRadius: 'var(--radius-md)',
																	cursor: 'pointer',
																	transition: 'all 0.2s ease',
																	display: 'flex',
																	alignItems: 'center',
																	gap: '0.75rem',
																	outline: 'none',
																}}>
																<span style={{ fontSize: '1.25rem' }}>
																	{option.icon}
																</span>
																<div style={{ flex: 1 }}>
																	<Select.ItemText>
																		<div
																			style={{
																				fontWeight: 'var(--font-weight-medium)',
																			}}>
																			{option.label}
																		</div>
																		<div
																			style={{
																				fontSize: '0.875rem',
																				color: 'var(--gray-500)',
																			}}>
																			{option.description}
																		</div>
																	</Select.ItemText>
																</div>
																<Select.ItemIndicator
																	style={{ marginLeft: 'auto' }}>
																	<CheckCircledIcon
																		style={{
																			width: '1rem',
																			height: '1rem',
																			color: 'var(--blue-600)',
																		}}
																	/>
																</Select.ItemIndicator>
															</Select.Item>
														))}
													</Select.Viewport>
												</Select.Content>
											</Select.Portal>
										</Select.Root>

										{selectedMetricOption && (
											<div
												style={{
													marginTop: '1rem',
													padding: '1rem',
													background: 'var(--blue-50)',
													borderRadius: 'var(--radius-md)',
													border: '1px solid var(--blue-200)',
												}}>
												<div
													style={{
														fontSize: '0.875rem',
														color: 'var(--blue-700)',
														fontWeight: 'var(--font-weight-medium)',
														marginBottom: '0.5rem',
													}}>
													💡 What this shows:
												</div>
												<div
													style={{
														fontSize: '0.75rem',
														color: 'var(--blue-600)',
														lineHeight: '1.4',
													}}>
													{selectedMetricOption.explanation}
												</div>
											</div>
										)}
									</div>

									<div className='action-buttons'>
										<button
											onClick={() => refetch()}
											disabled={isRefetching}
											className='btn btn-secondary'>
											{isRefetching ? (
												<ReloadIcon className='w-4 h-4 animate-spin' />
											) : (
												<ReloadIcon className='w-4 h-4' />
											)}
											Refresh
										</button>
										<button
											onClick={triggerManualFetch}
											className='btn btn-primary'>
											<PlayIcon className='w-4 h-4' />
											Trigger
										</button>
									</div>

									{data && (
										<div className='stats-panel'>
											<div className='stats-content'>
												<div className='stats-header'>
													<ActivityLogIcon className='w-4 h-4' />
													System Status
												</div>
												<div className='stats-grid'>
													<div className='stat-item'>
														<div className='stat-value info'>
															{data.total_metrics}
														</div>
														<div className='stat-label'>Total Metrics</div>
													</div>
													<div className='stat-item'>
														<div className='stat-value success'>
															{data.fetch_stats.successful_fetches}
														</div>
														<div className='stat-label'>Successful</div>
													</div>
													<div className='stat-item'>
														<div className='stat-value error'>
															{data.fetch_stats.failed_fetches}
														</div>
														<div className='stat-label'>Failed</div>
													</div>
													<div className='stat-item'>
														<div className='stat-value warning'>
															{data.fetch_stats.total_duration_ms}ms
														</div>
														<div className='stat-label'>Fetch Time</div>
													</div>
												</div>
											</div>
										</div>
									)}
								</div>

								{/* Results Panel */}
								<div className='results-panel'>
									<div className='results-header'>
										<div className='results-title-section'>
											<span className='results-icon'>
												{selectedMetricOption.icon}
											</span>
											<div>
												<div className='results-title'>
													Top 10 by {selectedMetricOption.label}
												</div>
												<div className='results-subtitle'>
													{selectedMetricOption.description}
												</div>
											</div>
										</div>

										<div className='results-meta'>
											{currentMetricData && (
												<>
													<div className='status-indicator'>
														✅ {currentMetricData.data_count} items
													</div>
													<div>⚡ {currentMetricData.fetch_time_ms}ms</div>
													<div>
														🕒{' '}
														{formatLastUpdate(
															data?.fetch_stats.last_update || ''
														)}
													</div>
												</>
											)}
										</div>
									</div>

									<div className='results-content'>
										{currentMetricData && currentMetricData.success ? (
											<div className='ranking-list'>
												{currentMetricData.all_data
													.slice(0, 10)
													.map((item, index) => (
														<div
															key={`${item?.name}-${index}`}
															className='ranking-item'>
															<div className='ranking-left'>
																<div className='ranking-position'>
																	{index + 1}
																</div>
																<div className='ranking-info'>
																	<div className='ranking-name'>
																		{item.name}
																	</div>
																	<div className='ranking-symbol'>
																		{item.symbol?.toUpperCase()}
																	</div>
																</div>
															</div>

															<div className='ranking-right'>
																<div className='ranking-value'>
																	{item.value}
																</div>
															</div>
														</div>
													))}
											</div>
										) : (
											<div className='loading-container'>
												<div className='loading-spinner'></div>
												<div className='loading-text'>
													Processing {selectedMetricOption.label} data...
												</div>
												<div className='loading-subtext'>
													Fetching from LunarCrush API via Inngest
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<Footer />

				{/* Toast Viewport */}
				<Toast.Viewport
					style={{
						position: 'fixed',
						bottom: 0,
						right: 0,
						display: 'flex',
						flexDirection: 'column',
						padding: '25px',
						gap: '10px',
						width: '390px',
						maxWidth: '100vw',
						margin: 0,
						listStyle: 'none',
						zIndex: 2147483647,
						outline: 'none',
					}}
				/>

				{/* Toast */}
				<ToastComponent
					open={toastOpen}
					onOpenChange={setToastOpen}
					title={toastMessage.title}
					description={toastMessage.description}
					type={toastMessage.type}
				/>
			</div>
		</Toast.Provider>
	);
}

// Main app wrapper with QueryClient
export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<CryptoDashboard />
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
