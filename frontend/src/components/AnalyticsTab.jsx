import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import formatCurrency from "../lib/currency";
import StatsPanel from "./StatsPanel";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
          setAnalyticsData({
            users: 0,
            products: 0,
            totalSales: 0,
            totalRevenue: 0,
          });
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
        Loading...
      </div>
    );
  }

  const openPanel = (type) => {
    setPanelType(type);
    setPanelOpen(true);
  };
  const closePanel = () => setPanelOpen(false);

  // sparkline values (last 12)
  const revenueSeries = (dailySalesData || [])
    .slice(-12)
    .map((d) => d.revenue || 0);

  const buildSparkPath = (values, width = 120, height = 30) => {
    if (!values || values.length === 0) return "";
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = width / (values.length - 1 || 1);
    return values
      .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top cards */}
        <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <AnalyticsCard
            title="Total Users"
            value={analyticsData.users.toLocaleString()}
            icon={Users}
            color="from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600"
            onClick={() => openPanel("users")}
          />
          <AnalyticsCard
            title="Total Products"
            value={analyticsData.products.toLocaleString()}
            icon={Package}
            color="from-emerald-500 to-green-700 hover:from-emerald-400 hover:to-green-600"
            onClick={() => openPanel("products")}
          />
          <AnalyticsCard
            title="Total Sales"
            value={analyticsData.totalSales.toLocaleString()}
            icon={ShoppingCart}
            color="from-emerald-500 to-cyan-700 hover:from-emerald-400 hover:to-cyan-600"
            onClick={() => openPanel("sales")}
          />
          <AnalyticsCard
            title="Total Revenue"
            value={formatCurrency(analyticsData.totalRevenue)}
            icon={DollarSign}
            color="from-emerald-500 to-lime-700 hover:from-emerald-400 hover:to-lime-600"
            sparkPath={buildSparkPath(revenueSeries)}
            onClick={() => openPanel("sales")}
          />
        </div>

        {panelOpen && <StatsPanel type={panelType} onClose={closePanel} />}

        {/* Chart */}
        <motion.div
          className="bg-gray-800/70  mt-12 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#374151" />
              <XAxis dataKey="name" stroke="#D1D5DB" />
              <YAxis yAxisId="left" stroke="#D1D5DB" />
              <YAxis yAxisId="right" orientation="right" stroke="#D1D5DB" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderRadius: "0.5rem",
                  border: "none",
                  color: "#D1D5DB",
                }}
                itemStyle={{ color: "#D1D5DB" }}
              />
              <Legend wrapperStyle={{ color: "#D1D5DB" }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                stroke="#10B981"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                name="Sales"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};
export default AnalyticsTab;

/* ----------------------- Card Component ----------------------- */
const AnalyticsCard = ({ title, value, icon: Icon, color, onClick, sparkPath }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.98 }}
    className={`relative rounded-2xl p-6 shadow-xl bg-gradient-to-br ${color}
               hover:shadow-emerald-700/50 transition-all duration-300 text-left`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-emerald-300 text-sm font-semibold mb-1">{title}</p>
        <h3 className="text-white text-3xl font-extrabold tracking-wide">{value}</h3>
        {sparkPath && (
          <svg
            width="120"
            height="30"
            viewBox="0 0 120 30"
            className="mt-2 block"
            preserveAspectRatio="none"
          >
            <path
              d={sparkPath}
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_4px_#60A5FA]"
            />
          </svg>
        )}
      </div>
    </div>
    {/* Decorative elements */}
    <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />
    <div className="absolute -bottom-6 -right-6 text-emerald-700 opacity-40 pointer-events-none">
      <Icon className="h-20 w-20" />
    </div>
  </motion.button>
);
