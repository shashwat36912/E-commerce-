import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import formatCurrency from "../lib/currency";
import StatsPanel from "./StatsPanel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AnalyticsTab = () => {
	const [analyticsData, setAnalyticsData] = useState({
		users: 0,
		products: 0,
		totalSales: 0,
		totalRevenue: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [dailySalesData, setDailySalesData] = useState([]);
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelType, setPanelType] = useState(null);

	useEffect(() => {
		const fetchAnalyticsData = async () => {
			try {
				const response = await axios.get("/analytics");
				setAnalyticsData(response.data.analyticsData);
				setDailySalesData(response.data.dailySalesData);
			} catch (error) {
				console.error("Error fetching analytics data:", error);
				if (error?.response?.status === 401 || error?.response?.status === 403) {
					setAnalyticsData({ users: 0, products: 0, totalSales: 0, totalRevenue: 0 });
					setDailySalesData([]);
					setIsLoading(false);
					return;
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchAnalyticsData();
	}, []);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	const openPanel = (type) => {
		setPanelType(type);
		setPanelOpen(true);
	};
	const closePanel = () => setPanelOpen(false);

	// derive a small revenue series for the sparkline (last 12 points)
	const revenueSeries = (dailySalesData || []).slice(-12).map((d) => d.revenue || 0);

	const buildSparkPath = (values, width = 120, height = 30) => {
		if (!values || values.length === 0) return '';
		const max = Math.max(...values);
		const min = Math.min(...values);
		const range = max - min || 1;
		const step = width / (values.length - 1 || 1);
		return values
			.map((v, i) => {
				const x = i * step;
				const y = height - ((v - min) / range) * height;
				return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
			})
			.join(' ');
	};

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<AnalyticsCard
					title='Total Users'
					value={analyticsData.users.toLocaleString()}
					icon={Users}
					color='from-emerald-500 to-teal-700'
					onClick={() => openPanel('users')}
				/>
				<AnalyticsCard
					title='Total Products'
					value={analyticsData.products.toLocaleString()}
					icon={Package}
					color='from-emerald-500 to-green-700'
					onClick={() => openPanel('products')}
				/>
				<AnalyticsCard
					title='Total Sales'
					value={analyticsData.totalSales.toLocaleString()}
					icon={ShoppingCart}
					color='from-emerald-500 to-cyan-700'
					onClick={() => openPanel('sales')}
				/>
				<AnalyticsCard
					title='Total Revenue'
					value={formatCurrency(analyticsData.totalRevenue)}
					icon={DollarSign}
					color='from-emerald-500 to-lime-700'
					sparkPath={buildSparkPath(revenueSeries)}
					onClick={() => openPanel('sales')}
				/>
			</div>
			{panelOpen && <StatsPanel type={panelType} onClose={closePanel} />}
			<motion.div
				className='bg-gray-800/60 rounded-lg p-6 shadow-lg'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.25 }}
			>
				<ResponsiveContainer width='100%' height={400}>
					<LineChart data={dailySalesData}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='name' stroke='#D1D5DB' />
						<YAxis yAxisId='left' stroke='#D1D5DB' />
						<YAxis yAxisId='right' orientation='right' stroke='#D1D5DB' />
						<Tooltip />
						<Legend />
						<Line
							yAxisId='left'
							type='monotone'
							dataKey='sales'
							stroke='#10B981'
							activeDot={{ r: 8 }}
							name='Sales'
						/>
						<Line
							yAxisId='right'
							type='monotone'
							dataKey='revenue'
							stroke='#3B82F6'
							activeDot={{ r: 8 }}
							name='Revenue'
						/>
					</LineChart>
				</ResponsiveContainer>
			</motion.div>
		</div>
	);
};
export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color, onClick, sparkPath }) => (
	<motion.button
		onClick={onClick}
		className={`bg-gray-800 rounded-lg p-6 shadow-lg overflow-hidden relative ${color} text-left cursor-pointer`}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className='flex justify-between items-center'>
			<div className='z-10'>
				<p className='text-emerald-300 text-sm mb-1 font-semibold z-20'>{title}</p>
				<h3 className='text-white text-3xl font-bold z-20'>{value}</h3>
				{sparkPath && (
					<div className='mt-2'>
						<svg width='120' height='30' viewBox={`0 0 120 30`} className='block' preserveAspectRatio='none'>
							<path d={sparkPath} fill='none' stroke='#60A5FA' strokeWidth='2' strokeLinejoin='round' strokeLinecap='round' />
						</svg>
					</div>
				)}
			</div>
		</div>
		{/* Decorative gradient circle (non-blocking) */}
		<div className='absolute -bottom-16 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-900 opacity-25 pointer-events-none' />
		<div className='absolute -bottom-6 -right-6 text-emerald-800 opacity-30 pointer-events-none'>
			<Icon className='h-20 w-20' />
		</div>
	</motion.button>
);
