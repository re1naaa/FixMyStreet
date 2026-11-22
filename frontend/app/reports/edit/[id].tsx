import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, ChevronLeft, ImagePlus, Trash2 } from "lucide-react-native";
import { Screen } from "../../../components/Screen";
import { colors, themedStyles } from "../../../constants/colors";
import { useSession } from "../../../hooks/useSession";
import { usePreferences } from "../../../hooks/usePreferences";
import { absolutePhotoUrl, getReport, listCategories, updateReport, uploadPhoto } from "../../../services/reports";
import type { Category, Priority, Report } from "../../../types/reports";

const priorities: Array<{ value: Priority; label: string; color: string }> = [
  { value: "low", label: "Low", color: colors.accent },
  { value: "medium", label: "Medium", color: colors.warning },
  { value: "high", label: "High", color: "#FF8A5B" },
  { value: "critical", label: "Critical", color: colors.danger },
];

export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useSession();
  const { t } = usePreferences();
  const [report, setReport] = useState<Report | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Priority>("medium");
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    const reportId = Number(id);
    Promise.all([getReport(token, reportId), listCategories(token)])
      .then(([item, cats]) => {
        setReport(item);
        setCategories(cats);
        setCategoryId(item.category_id);
        setTitle(item.title);
        setDescription(item.description);
        setUrgency(item.urgency);
        if (!item.can_edit) setBlocked(true);
      })
      .catch(() => setBlocked(true))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission was denied.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
    const asset = result.canceled ? null : result.assets[0];
    if (asset) {
      setPhoto({ uri: asset.uri, name: asset.fileName ?? "report.jpg", type: asset.mimeType ?? "image/jpeg" });
      setRemovePhoto(false);
    }
  }

  async function save() {
    if (!token || !report) return;
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let photoPath: string | undefined;
      if (photo) {
        photoPath = (await uploadPhoto(token, photo.uri, photo.name, photo.type)).photo_path;
      }
      const updated = await updateReport(token, report.id, {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        urgency,
        ...(photoPath ? { photo_path: photoPath } : {}),
        ...(removePhoto && !photo ? { remove_photo: true } : {}),
      });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save changes.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Screen><View style={styles.centered}><ActivityIndicator color={colors.accent} /></View></Screen>;
  }
  if (blocked || !report) {
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}><ChevronLeft size={22} color={colors.text} /></Pressable>
          <Text style={styles.headerTitle}>Edit report</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.blockedText}>This report can no longer be edited.</Text>
          <Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Go back</Text></Pressable>
        </View>
      </Screen>
    );
  }

  const existingPhoto = !removePhoto && !photo ? absolutePhotoUrl(report.photo_url) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}><ChevronLeft size={22} color={colors.text} /></Pressable>
        <Text style={styles.headerTitle}>Edit report</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Report details</Text>
        <Text style={styles.subheading}>Update your report while it is still under review.</Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((item) => {
            const selected = categoryId === item.id;
            return (
              <Pressable key={item.id} onPress={() => setCategoryId(selected ? null : item.id)} style={[styles.category, selected && styles.categorySelected]}>
                <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>{item.name}</Text>
                {selected && <View style={styles.check}><Check size={11} color="#FFF" /></View>}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="What needs attention?" placeholderTextColor={colors.muted} style={styles.input} maxLength={140} />
        <Text style={styles.count}>{title.length}/140</Text>

        <Text style={styles.label}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Describe the location, size, or danger…" placeholderTextColor={colors.muted} style={[styles.input, styles.textArea]} multiline textAlignVertical="top" maxLength={3000} />

        <Text style={styles.label}>Urgency</Text>
        <View style={styles.priorityRow}>
          {priorities.map((item) => {
            const selected = urgency === item.value;
            return (
              <Pressable key={item.value} onPress={() => setUrgency(item.value)} style={[styles.priority, selected && { backgroundColor: item.color, borderColor: item.color }]}>
                <View style={[styles.priorityDot, { backgroundColor: selected ? "#FFF" : item.color }]} />
                <Text style={[styles.priorityText, selected && { color: "#FFF" }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Photo</Text>
        {photo ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <Pressable style={styles.remove} onPress={() => setPhoto(null)}><Trash2 size={16} color="#FFF" /></Pressable>
          </View>
        ) : existingPhoto ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: existingPhoto }} style={styles.preview} />
            <Pressable style={styles.remove} onPress={() => setRemovePhoto(true)}><Trash2 size={16} color="#FFF" /></Pressable>
          </View>
        ) : null}
        <Pressable style={styles.photoButton} onPress={() => void pickPhoto()}>
          <ImagePlus size={18} color={colors.accent} />
          <Text style={styles.photoButtonText}>{photo || existingPhoto ? "Replace photo" : "Add a photo"}</Text>
        </Pressable>
        {removePhoto && !photo ? <Text style={styles.photoHint}>The current photo will be removed when you save.</Text> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.button} disabled={submitting} onPress={() => void save()}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <><Check size={18} color="#FFF" /><Text style={styles.buttonText}>Save changes</Text></>}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = themedStyles(() => ({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  blockedText: { color: colors.muted, fontSize: 14, textAlign: "center" },
  header: { height: 60, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.navy, fontSize: 16, fontWeight: "800" },
  content: { padding: 18, paddingBottom: 24 },
  heading: { color: colors.navy, fontSize: 24, fontWeight: "800" },
  subheading: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: 18 },
  label: { color: colors.text, fontWeight: "700", fontSize: 13, marginTop: 14, marginBottom: 8 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  textArea: { minHeight: 120, paddingTop: 12 },
  count: { color: colors.muted, fontSize: 10, textAlign: "right", marginTop: 4 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  category: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 13, height: 38, backgroundColor: colors.card },
  categorySelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  categoryName: { color: colors.text, fontSize: 12, fontWeight: "700" },
  categoryNameSelected: { color: "#FFF" },
  check: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  priorityRow: { flexDirection: "row", gap: 8 },
  priority: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  previewWrap: { height: 160, borderRadius: 18, overflow: "hidden", marginBottom: 10 },
  preview: { width: "100%", height: "100%" },
  remove: { position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  photoButton: { height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  photoButtonText: { color: colors.accent, fontWeight: "700", fontSize: 13 },
  photoHint: { color: colors.muted, fontSize: 11, marginTop: 8, textAlign: "center" },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 10, marginTop: 14, fontSize: 13 },
  footer: { padding: 16, paddingTop: 8 },
  button: { height: 54, borderRadius: 16, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
}));
