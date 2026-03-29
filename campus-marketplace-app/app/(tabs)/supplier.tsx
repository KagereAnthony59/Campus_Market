import { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, 
  KeyboardAvoidingView, Platform, StatusBar, FlatList, ActivityIndicator,
  Modal, ScrollView, Image
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SupplierScreen() {
  const [supplier, setSupplier] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products'
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Add Product State
  const [isAddProductVisible, setIsAddProductVisible] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductImage, setNewProductImage] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (supplier) fetchDashboardData();
    }, [supplier, activeTab])
  );

  const checkAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem('supplierAccount');
      if (stored) setSupplier(JSON.parse(stored));
    } catch (e) {}
    setLoadingInitial(false);
  };

  const handleSignUp = async () => {
    if (!name || !email || !phone) return Alert.alert("Missing Fields", "Please enter all details.");
    setIsSubmitting(true);
    try {
      const res = await fetch("http://10.18.0.192:3000/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone })
      });
      const data = await res.json();
      await AsyncStorage.setItem('supplierAccount', JSON.stringify(data));
      setSupplier(data);
      Alert.alert("Success", "Supplier account ready! Welcome to your Portal.");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('supplierAccount');
    setSupplier(null);
  };

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const endpoint = activeTab === 'orders' 
        ? `http://10.18.0.192:3000/orders/supplier/${supplier.email}`
        : `http://10.18.0.192:3000/products/supplier/${supplier.email}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert("Delete", "Are you sure you want to remove this product?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await fetch(`http://10.18.0.192:3000/products/${id}`, { method: "DELETE" });
          fetchDashboardData();
        } catch (e) {
          Alert.alert("Error", "Failed to delete.");
        }
      }}
    ]);
  };

  const handleUpdateOrderStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Pending" ? "Shipped" : "Completed";
    try {
      await fetch(`http://10.18.0.192:3000/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchDashboardData();
    } catch (e) {
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const pickGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.2, // Compresses image strictly to prevent Express 413 Payload errors
      base64: true
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setNewProductImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takeCameraPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Permissions", "Camera permission is required.");
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.2, // Prevents giant multi-megabyte JSON strings
      base64: true
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setNewProductImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const submitProduct = async () => {
    if (!newProductName || !newProductPrice) return Alert.alert("Missing Fields", "Name and Price are required.");
    
    try {
      const response = await fetch("http://10.18.0.192:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductName,
          description: newProductDesc,
          price: parseInt(newProductPrice),
          sellerName: supplier.name,
          supplierContact: supplier.email,
          imageUrl: newProductImage
        })
      });
      
      if (!response.ok) {
        throw new Error("Backend rejected the product save. (Likely image payload too large)");
      }
      
      Alert.alert("Success", "Product Added!");
      setIsAddProductVisible(false);
      setNewProductName(''); setNewProductDesc(''); setNewProductPrice(''); setNewProductImage(null);
      
      // Auto switch back to My Products to see it
      if (activeTab === 'products') {
        fetchDashboardData();
      } else {
        setActiveTab('products');
      }
    } catch (e) {
      Alert.alert("Error", "Upload failed.");
    }
  };

  if (loadingInitial) return <View style={styles.center}><ActivityIndicator color="#3B82F6" size="large"/></View>;

  // --- SIGN UP / LOGIN VIEW ---
  if (!supplier) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.formCard}>
          <View style={styles.iconContainer}><IconSymbol name="person.crop.circle.fill" size={60} color="#3B82F6" /></View>
          <Text style={styles.title}>Supplier Portal</Text>
          <Text style={styles.subtitle}>Apply to become a verified supplier on the Campus Market.</Text>
          <TextInput style={styles.input} placeholder="Business Name" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Business Email" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#94A3B8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TouchableOpacity style={[styles.submitButton, isSubmitting && {opacity:0.7}]} onPress={handleSignUp} disabled={isSubmitting}>
            <Text style={styles.submitButtonText}>{isSubmitting ? "Processing..." : "Access Dashboard"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <View style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.dashHeader}>
        <View>
          <Text style={styles.greeting}>Supplier Dashboard</Text>
          <Text style={styles.supplierName}>{supplier.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'orders' && styles.activeTabBtn]} onPress={() => setActiveTab('orders')}>
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'products' && styles.activeTabBtn]} onPress={() => setActiveTab('products')}>
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>My Products</Text>
        </TouchableOpacity>
        {activeTab === 'products' && (
          <TouchableOpacity style={styles.addNewInlineBtn} onPress={() => setIsAddProductVisible(true)}>
            <Text style={styles.addNewInlineText}>+ Add New</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listContainer}>
        {loadingData ? <ActivityIndicator color="#3B82F6" size="large" style={{marginTop: 50}}/> 
         : dashboardData.length === 0 ? <View style={styles.center}><Text style={styles.emptyText}>No {activeTab} found.</Text></View>
         : (
          <FlatList
            data={dashboardData}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
              if (activeTab === 'products') {
                return (
                  <View style={styles.card}>
                    {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.cardImagePreview} />}
                    <View style={{flex: 1, paddingLeft: item.imageUrl ? 12 : 0}}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardSub}>Price: ${item.price}</Text>
                      {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item._id)}>
                       <Text style={styles.deleteText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                );
              } else {
                return (
                  <View style={styles.card}>
                    <View>
                      <Text style={styles.cardTitle}>Order: {item.productName}</Text>
                      <Text style={styles.cardSub}>Buyer: {item.buyerEmail}</Text>
                      <Text style={styles.cardSub}>Status: <Text style={styles.statusText}>{item.status}</Text></Text>
                    </View>
                    {item.status !== "Completed" && (
                      <TouchableOpacity style={styles.updateBtn} onPress={() => handleUpdateOrderStatus(item._id, item.status)}>
                        <Text style={styles.updateText}>Update Status</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }
            }}
          />
        )}
      </View>

      {/* ADD PRODUCT MODAL */}
      <Modal animationType="slide" transparent={true} visible={isAddProductVisible} onRequestClose={() => setIsAddProductVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Product</Text>
            
            {/* Image Section */}
            <View style={styles.imageBox}>
              {newProductImage ? (
                <Image source={{ uri: newProductImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholderBox}><Text style={styles.placeholderText}>No Image Selected</Text></View>
              )}
              <View style={styles.imageControllers}>
                <TouchableOpacity onPress={takeCameraPhoto} style={styles.cameraBtn}><Text style={styles.cameraBtnText}>📷 Camera</Text></TouchableOpacity>
                <TouchableOpacity onPress={pickGallery} style={styles.galleryBtn}><Text style={styles.galleryBtnText}>🖼️ Gallery</Text></TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.inputModal} placeholder="Rolex Watch" placeholderTextColor="#64748B" value={newProductName} onChangeText={setNewProductName}/>

            <Text style={styles.label}>Brief Description</Text>
            <TextInput style={[styles.inputModal, {height: 80, textAlignVertical: 'top'}]} multiline placeholder="Describe the item..." placeholderTextColor="#64748B" value={newProductDesc} onChangeText={setNewProductDesc}/>

            <Text style={styles.label}>Price ($)</Text>
            <TextInput style={styles.inputModal} placeholder="99" keyboardType="numeric" placeholderTextColor="#64748B" value={newProductPrice} onChangeText={setNewProductPrice}/>

            <TouchableOpacity style={styles.submitProductBtn} onPress={submitProduct}>
              <Text style={styles.submitProductText}>List Product on Market</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddProductVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  formCard: { backgroundColor: '#1E293B', padding: 24, borderRadius: 20, elevation: 8, borderWidth: 1, borderColor: '#334155' },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#F8FAFC' },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 24, textAlign: 'center', lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#334155', padding: 16, marginBottom: 16, borderRadius: 12, backgroundColor: '#0F172A', color: '#F8FAFC', fontSize: 16 },
  submitButton: { backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  dashboardContainer: { flex: 1, backgroundColor: '#0F172A', paddingTop: 50 },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  greeting: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  supplierName: { color: '#F8FAFC', fontSize: 24, fontWeight: '800' },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  logoutText: { color: '#EF4444', fontWeight: '700' },
  
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#334155' },
  activeTabBtn: { borderBottomColor: '#3B82F6' },
  tabText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
  activeTabText: { color: '#3B82F6', fontWeight: '800' },
  
  addNewInlineBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center', marginLeft: 10 },
  addNewInlineText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  listContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  emptyText: { color: '#94A3B8', fontSize: 16 },
  card: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  cardImagePreview: { width: 50, height: 50, borderRadius: 8 },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSub: { color: '#94A3B8', fontSize: 14, marginBottom: 2 },
  cardDesc: { color: '#CBD5E1', fontSize: 12 },
  statusText: { color: '#34D399', fontWeight: '800' },
  
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  deleteText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  updateBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 4},
  updateText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 20, paddingVertical: 40, justifyContent: 'center' },
  modalContent: { backgroundColor: '#1E293B', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 24, color: '#FFF', fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  imageBox: { alignSelf: 'center', width: '100%', marginBottom: 20 },
  previewImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10, resizeMode: 'cover' },
  placeholderBox: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  placeholderText: { color: '#94A3B8', fontSize: 14 },
  imageControllers: { flexDirection: 'row', justifyContent: 'space-between' },
  cameraBtn: { flex: 1, backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 8, marginRight: 5, alignItems: 'center' },
  cameraBtnText: { color: '#FFF', fontWeight: '700' },
  galleryBtn: { flex: 1, backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 8, marginLeft: 5, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  galleryBtnText: { color: '#F8FAFC', fontWeight: '700' },
  
  label: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 8, marginLeft: 4 },
  inputModal: { borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 16, borderRadius: 12, backgroundColor: '#0F172A', color: '#FFF', fontSize: 16 },
  
  submitProductBtn: { backgroundColor: '#34D399', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitProductText: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  cancelBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 5 },
  cancelText: { color: '#EF4444', fontSize: 16, fontWeight: '700' }
});
