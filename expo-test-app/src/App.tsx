import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_ENDPOINT = "https://yourdomain.com/connect";
const DEFAULT_GAME = "PUBG";

interface ConnectResult {
  status: boolean;
  reason?: string;
  data?: {
    token: string;
    real: string;
    modname: string;
    mod_status: string;
    credit: string;
    EXP: string;
    device: number;
    rng: number;
    game: string;
    gameDisplayName: string;
    keyStatus: string;
    durationLabel: string;
    expiresAt: string;
    timeLeftMs: number;
    timeLeft: string;
    maxDevices: number;
    usedDevices: number;
    ESP: string;
    Item: string;
    AIM: string;
    SilentAim: string;
    BulletTrack: string;
    Floating: string;
    Memory: string;
    Setting: string;
  };
}

function generateSerial(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "expo-";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function App() {
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [game, setGame] = useState(DEFAULT_GAME);
  const [userKey, setUserKey] = useState("");
  const [serial, setSerial] = useState(generateSerial());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConnectResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const testConnect = async () => {
    if (!userKey.trim()) {
      Alert.alert("Error", "Please enter a key");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, user_key: userKey.trim(), serial }),
      });
      const json: ConnectResult = await res.json();
      setResult(json);
    } catch (err: any) {
      setResult({ status: false, reason: err.message || "Connection failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>KeyPanel Tester</Text>
        <Text style={styles.subtitle}>Connect Endpoint Test</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your license key"
            placeholderTextColor="#666"
            value={userKey}
            onChangeText={setUserKey}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Game</Text>
          <TextInput
            style={styles.input}
            placeholder="Game name"
            placeholderTextColor="#666"
            value={game}
            onChangeText={setGame}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.settingsToggle}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={styles.settingsText}>
              {showSettings ? "Hide Settings" : "Show Settings"}
            </Text>
          </TouchableOpacity>

          {showSettings && (
            <View>
              <Text style={styles.label}>Endpoint URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yourdomain.com/connect"
                placeholderTextColor="#666"
                value={endpoint}
                onChangeText={setEndpoint}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.label}>Device Serial</Text>
              <TextInput
                style={styles.input}
                value={serial}
                onChangeText={setSerial}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setSerial(generateSerial())}
              >
                <Text style={styles.secondaryBtnText}>Regenerate Serial</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={testConnect}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Test Connect</Text>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={[styles.card, result.status ? styles.cardSuccess : styles.cardError]}>
            <View style={styles.statusRow}>
              <Text style={styles.statusIcon}>{result.status ? "✓" : "✗"}</Text>
              <Text style={[styles.statusText, result.status ? styles.successText : styles.errorText]}>
                {result.status ? "Connected" : "Failed"}
              </Text>
            </View>

            {result.reason && (
              <Text style={styles.reason}>{result.reason}</Text>
            )}

            {result.data && (
              <View style={styles.dataSection}>
                <ResultRow label="Game" value={result.data.gameDisplayName || result.data.game} />
                <ResultRow label="Status" value={result.data.keyStatus} />
                <ResultRow label="Duration" value={result.data.durationLabel} />
                <ResultRow label="Time Left" value={result.data.timeLeft} />
                <ResultRow label="Expires" value={new Date(result.data.expiresAt).toLocaleString()} />
                <ResultRow label="Devices" value={`${result.data.usedDevices} / ${result.data.maxDevices}`} />
                <ResultRow label="Mod" value={result.data.modname} />
                <ResultRow label="Mod Status" value={result.data.mod_status} />
                <ResultRow label="Credit" value={result.data.credit} />

                <Text style={styles.sectionTitle}>Features</Text>
                <View style={styles.featureGrid}>
                  <FeatureBadge name="ESP" value={result.data.ESP} />
                  <FeatureBadge name="AIM" value={result.data.AIM} />
                  <FeatureBadge name="Item" value={result.data.Item} />
                  <FeatureBadge name="SilentAim" value={result.data.SilentAim} />
                  <FeatureBadge name="BulletTrack" value={result.data.BulletTrack} />
                  <FeatureBadge name="Floating" value={result.data.Floating} />
                  <FeatureBadge name="Memory" value={result.data.Memory} />
                  <FeatureBadge name="Setting" value={result.data.Setting} />
                </View>

                <Text style={styles.sectionTitle}>Token Info</Text>
                <ResultRow label="Token" value={result.data.token.substring(0, 16) + "..."} />
                <ResultRow label="Secret Ver." value={String((result.data as any).secret_version || "-")} />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value || "-"}</Text>
    </View>
  );
}

function FeatureBadge({ name, value }: { name: string; value: string }) {
  const isOn = value === "on";
  return (
    <View style={[styles.badge, isOn ? styles.badgeOn : styles.badgeOff]}>
      <Text style={[styles.badgeText, isOn ? styles.badgeTextOn : styles.badgeTextOff]}>
        {name}: {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", color: "#e0e0ff", textAlign: "center", marginTop: 10 },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 20 },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
  },
  cardSuccess: { borderColor: "#22c55e33" },
  cardError: { borderColor: "#ef444433" },
  label: { fontSize: 13, color: "#aaa", marginBottom: 6, marginTop: 12, fontWeight: "600" },
  input: {
    backgroundColor: "#16163a",
    borderRadius: 8,
    padding: 12,
    color: "#e0e0ff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2a2a4a",
  },
  btn: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  secondaryBtn: {
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  secondaryBtnText: { color: "#6366f1", fontSize: 13 },
  settingsToggle: { marginTop: 12 },
  settingsText: { color: "#6366f1", fontSize: 13 },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statusIcon: { fontSize: 24, marginRight: 8 },
  statusText: { fontSize: 20, fontWeight: "bold" },
  successText: { color: "#22c55e" },
  errorText: { color: "#ef4444" },
  reason: { color: "#ef4444", fontSize: 14, marginBottom: 8 },
  dataSection: { marginTop: 4 },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4a",
  },
  resultLabel: { color: "#888", fontSize: 13 },
  resultValue: { color: "#e0e0ff", fontSize: 13, fontWeight: "500", maxWidth: "60%" as any, textAlign: "right" },
  sectionTitle: { color: "#6366f1", fontSize: 14, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeOn: { backgroundColor: "#22c55e22" },
  badgeOff: { backgroundColor: "#ef444422" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  badgeTextOn: { color: "#22c55e" },
  badgeTextOff: { color: "#ef4444" },
});
