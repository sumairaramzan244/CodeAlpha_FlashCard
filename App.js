import React, { useEffect, useMemo, useRef, useState } from 'react';
import {SafeAreaView,View,Text,TextInput,TouchableOpacity,FlatList,Modal,StyleSheet,Platform,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'CA_FLASHCARDS_V1';

// Professional Flashcards
const seed = [
  { id: '1', question: 'What is React Native?', answer: 'A cross-platform framework for building mobile apps using JavaScript and React.' },
  { id: '2', question: 'Difference between State and Props?', answer: 'State is mutable and managed within a component; Props are immutable and passed from parent to child.' },
  { id: '3', question: 'What is AsyncStorage in React Native?', answer: 'A simple, unencrypted, asynchronous, persistent, key-value storage system for small data.' },
  { id: '4', question: 'What is the purpose of useEffect hook?', answer: 'It allows you to perform side effects in functional components, like fetching data or subscribing to events.' },
  { id: '5', question: 'Explain Flexbox in React Native.', answer: 'A layout system used for arranging components in rows or columns with alignment and spacing control.' },
  { id: '6', question: 'What is Expo?', answer: 'A framework and platform for universal React applications that simplifies development, testing, and deployment.' },
  { id: '7', question: 'Why use FlatList instead of ScrollView?', answer: 'FlatList is optimized for large lists by rendering items lazily, while ScrollView renders all items at once.' },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Modal form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const qRef = useRef(null);

  // Load
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setCards(JSON.parse(raw));
        } else {
          setCards(seed);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        }
      } catch (e) {
        console.warn('Failed to load storage', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards)).catch(() => {});
    }
  }, [cards, loading]);

  const canNavigate = cards.length > 0;
  const current = useMemo(
    () => (cards.length ? cards[currentIndex % cards.length] : null),
    [cards, currentIndex]
  );

  function resetForm() {
    setEditingId(null);
    setQ('');
    setA('');
  }

  function openCreate() {
    resetForm();
    setModalVisible(true);
    setTimeout(() => qRef.current?.focus(), 100);
  }

  function openEdit(card) {
    setEditingId(card.id);
    setQ(card.question);
    setA(card.answer);
    setModalVisible(true);
    setTimeout(() => qRef.current?.focus(), 100);
  }

  function saveCard() {
    const question = q.trim();
    const answer = a.trim();
    if (!question || !answer) {
      return;
    }
    if (editingId) {
      setCards((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, question, answer } : c))
      );
    } else {
      setCards((prev) => [{ id: uid(), question, answer }, ...prev]);
    }
    setModalVisible(false);
    resetForm();
  }

  // ✅ Direct delete
  function deleteCard(cardId) {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }

  function startStudy() {
    if (!cards.length) return;
    setStudyMode(true);
    setCurrentIndex(0);
    setShowAnswer(false);
  }

  function exitStudy() {
    setStudyMode(false);
    setShowAnswer(false);
  }

  function next() {
    if (!cards.length) return;
    setCurrentIndex((i) => (i + 1) % cards.length);
    setShowAnswer(false);
  }

  function prev() {
    if (!cards.length) return;
    setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
    setShowAnswer(false);
  }

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Flashcard Quiz</Text>
      <Text style={styles.sub}>
        {cards.length} card{cards.length === 1 ? '' : 's'}
      </Text>
    </View>
  );

  const CardItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardQ} numberOfLines={2}>
          {item.question}
        </Text>
        <Text style={styles.cardA} numberOfLines={1}>
          {item.answer}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.delBtn}
        onPress={() => deleteCard(item.id)}
      >
        <Text style={styles.delText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const Empty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No flashcards yet. Add one!</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <Text style={styles.sub}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (studyMode) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        {!current ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No cards to study.</Text>
          </View>
        ) : (
          <View style={styles.studyWrap}>
            <View style={styles.studyCard}>
              <Text style={styles.studyLabel}>
                {showAnswer ? 'Answer' : 'Question'}
              </Text>
              <Text style={styles.studyText}>
                {showAnswer ? current.answer : current.question}
              </Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, styles.secondary]}
                onPress={prev}
                disabled={!canNavigate}
              >
                <Text style={styles.btnText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.primary]}
                onPress={() => setShowAnswer((s) => !s)}
              >
                <Text style={styles.btnText}>
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.secondary]}
                onPress={next}
                disabled={!canNavigate}
              >
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.btn, styles.ghost]}
              onPress={exitStudy}
            >
              <Text style={styles.ghostText}>Exit Study</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={openCreate}>
          <Text style={styles.btnText}>Add Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.secondary]}
          onPress={startStudy}
          disabled={!cards.length}
        >
          <Text style={styles.btnText}>Study</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CardItem item={item} />}
        contentContainerStyle={
          cards.length
            ? { padding: 16 }
            : { flex: 1, justifyContent: 'center', alignItems: 'center' }
        }
        ListEmptyComponent={<Empty />}
        showsVerticalScrollIndicator={true}   // ✅ scroll bar enabled
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Flashcard' : 'New Flashcard'}
            </Text>

            <Text style={styles.label}>Question</Text>
            <TextInput
              ref={qRef}
              value={q}
              onChangeText={setQ}
              placeholder="Enter question"
              style={styles.input}
              multiline
            />

            <Text style={styles.label}>Answer</Text>
            <TextInput
              value={a}
              onChangeText={setA}
              placeholder="Enter answer"
              style={[styles.input, { minHeight: 80 }]}
              multiline
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, styles.secondary]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.primary]} onPress={saveCard}>
                <Text style={styles.btnText}>{editingId ? 'Save Changes' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 16, paddingTop: Platform.OS === 'android' ? 32 : 16 },
  title: { color: 'white', fontSize: 24, fontWeight: '800' },
  sub: { color: '#94a3b8', marginTop: 4 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
    elevation: 1,
  },
  primary: { backgroundColor: '#22c55e' },
  secondary: { backgroundColor: '#334155' },
  ghost: { backgroundColor: 'transparent' },
  btnText: { color: 'white', fontWeight: '700' },
  ghostText: { color: '#94a3b8', fontWeight: '700', textAlign: 'center' },

  card: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardQ: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardA: { color: '#94a3b8', fontSize: 14 },

  delBtn: {
    marginLeft: 12,
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  delText: { color: 'white', fontWeight: '700', fontSize: 12 },

  empty: { alignItems: 'center' },
  emptyText: { color: '#94a3b8' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  studyWrap: { flex: 1, padding: 16, gap: 16, paddingBottom: 32 }, // ✅ adjusted
  studyCard: {
    backgroundColor: '#1f2937',
    flex: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
  },
  studyLabel: { color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  studyText: { color: 'white', fontSize: 20, lineHeight: 28, fontWeight: '700' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0b1220',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  label: { color: '#94a3b8', marginTop: 6 },
  input: {
    backgroundColor: '#111827',
    color: 'white',
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
    textAlignVertical: 'top',
  },
});
