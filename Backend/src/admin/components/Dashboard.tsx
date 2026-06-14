import React from "react";
import { Box, H1, H2, Text, Button } from "@adminjs/design-system";

type DashboardProps = {
  data?: {
    totalTours?: number;
    totalInquiries?: number;
    unreadInquiries?: number;
    totalUsers?: number;
  };
};

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <Box
    style={{
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: "18px",
      padding: "24px",
      boxShadow: "0 12px 30px rgba(0, 51, 102, 0.08)",
    }}
  >
    <Text
      style={{
        color: "#6B7886",
        fontSize: "13px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: "12px",
      }}
    >
      {label}
    </Text>

    <H2
      style={{
        color,
        fontSize: "36px",
        margin: 0,
      }}
    >
      {value}
    </H2>
  </Box>
);

const Dashboard = ({ data }: DashboardProps) => {
  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "32px",
      }}
    >
      <Box
        style={{
          background: "linear-gradient(135deg, #003366 0%, #001A33 100%)",
          borderRadius: "26px",
          padding: "42px",
          marginBottom: "28px",
          boxShadow: "0 20px 50px rgba(0, 26, 51, 0.22)",
        }}
      >
        <Text
          style={{
            color: "#F2B632",
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          Mountain Helicopters Nepal
        </Text>

        <H1
          style={{
            color: "#FFFFFF",
            fontSize: "42px",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Admin Dashboard
        </H1>

        <Text
          style={{
            color: "#E6F0F8",
            fontSize: "16px",
            lineHeight: 1.7,
            maxWidth: "760px",
            marginTop: "14px",
          }}
        >
          Manage helicopter tours, booking inquiries, and website content from one secure backend panel.
        </Text>
      </Box>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <StatCard label="Total Tours" value={data?.totalTours ?? 0} color="#003366" />
        <StatCard label="Total Inquiries" value={data?.totalInquiries ?? 0} color="#F2B632" />
        <StatCard label="Unread Inquiries" value={data?.unreadInquiries ?? 0} color="#EF4444" />
        <StatCard label="Admin Users" value={data?.totalUsers ?? 0} color="#10B981" />
      </Box>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >
        <Box
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 12px 30px rgba(0, 51, 102, 0.08)",
          }}
        >
          <H2 style={{ color: "#003366", marginTop: 0 }}>
            Website Content
          </H2>

          <Text
            style={{
              color: "#1E2A3A",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "22px",
            }}
          >
            Create, update, and publish helicopter tours. All changes are saved in the database and shown on the frontend through backend APIs.
          </Text>

          <Box style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Button as="a" href="/admin/resources/Tour" variant="primary">
              Manage Tours
            </Button>

            <Button as="a" href="/admin/resources/Inquiry" variant="outlined">
              View Inquiries
            </Button>
          </Box>
        </Box>

        <Box
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 12px 30px rgba(0, 51, 102, 0.08)",
          }}
        >
          <H2 style={{ color: "#003366", marginTop: 0 }}>
            System Status
          </H2>

          <Text
            style={{
              color: "#1E2A3A",
              fontSize: "15px",
              lineHeight: 1.7,
            }}
          >
            Admin panel is connected to the backend database.
          </Text>

          <Box
            style={{
              marginTop: "18px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#E6F0F8",
              color: "#003366",
              fontWeight: 700,
            }}
          >
            System Online
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;