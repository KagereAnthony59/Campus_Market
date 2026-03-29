import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  TextInput,
  ScrollView,
  StatusBar,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FeedScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // New State for UI Features
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [selectedSupplierProduct, setSelectedSupplierProduct] = useState<any>(null);

  // User Profile State
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [userName, setUserName] = useState('Anthony Kagere');
  const [userAbout, setUserAbout] = useState('Computer Science Student at UMU');
  const [userPhone, setUserPhone] = useState('+256 700 000 000');
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?img=11');

  const categories = ['All', 'Electronics', 'Books', 'Furniture', 'Clothing', 'Other'];

  const theme = useMemo(() => {
    return {
      background: isDarkTheme ? '#0F172A' : '#F0F4F8',
      card: isDarkTheme ? '#1E293B' : '#FFFFFF',
      text: isDarkTheme ? '#F8FAFC' : '#0F172A',
      textSub: isDarkTheme ? '#94A3B8' : '#64748B',
      border: isDarkTheme ? '#334155' : '#E2E8F0',
      primary: '#3B82F6',
      success: '#34D399',
      modalOverlay: isDarkTheme ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.4)',
    };
  }, [isDarkTheme]);

  const styles = useMemo(() => getStyles(theme), [theme]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://10.18.0.192:3000/products");
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(p => p.name?.toLowerCase().includes(lower))
      );
    }
  }, [searchQuery, products]);

  const handleBuy = (product: any) => {
    Alert.alert(
      "Confirm Order",
      `Purchase ${product.name} for $${product.price}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              const res = await fetch("http://10.18.0.192:3000/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: product._id,
                  productName: product.name,
                  price: product.price,
                  buyerEmail: "student@umu.edu",
                  sellerEmail: product.supplierContact || product.sellerName || "Unknown"
                })
              });
              const text = await res.text();
              Alert.alert("Success!", text);
            } catch (err) {
              Alert.alert("Error", "Could not place order. Is the backend running?");
            }
          } 
        }
      ]
    );
  };

  const getSupplierInfo = (productName: string) => {
    const suppliers = ['Campus Tech Store', 'Dorm Essentials', 'John Doe Trade', 'UMU Thrift', 'Admin Demo'];
    let nameHash = 0;
    const safeName = productName || 'Unknown';
    for (let i = 0; i < safeName.length; i++) nameHash += safeName.charCodeAt(i);
    
    return {
      name: suppliers[nameHash % suppliers.length],
      rating: (3.5 + (nameHash % 15) / 10).toFixed(1),
      location: 'UMU Campus Area',
      contact: `supplier_${nameHash % 100}@umu.edu`
    };
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUserAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image", error);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Top Profile Banner & Theme Toggle */}
      <View style={styles.topProfileBar}>
        <TouchableOpacity 
          style={styles.userInfoRow} 
          onPress={() => setIsProfileModalVisible(true)}
          activeOpacity={0.7}
        >
          <Image 
            source={{ uri: userAvatar }} 
            style={styles.userAvatar} 
          />
          <View style={styles.userTextCol}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.themeToggleBtn} 
          onPress={() => setIsDarkTheme(!isDarkTheme)}
        >
          <IconSymbol 
            name={isDarkTheme ? "sun.max.fill" : "moon.fill"} 
            size={24} 
            color={theme.text} 
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.welcomeText}>Campus Market</Text>
      <Text style={styles.subtitle}>Find what you need today.</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={22} color={theme.textSub} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.textSub}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
      >
        {categories.map((cat, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.categoryChip, activeCategory === cat && styles.activeCategoryChip]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>
        {searchQuery ? "Search Results" : "Trending Items"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList 
        data={filteredProducts}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
           loading ? (
             <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 50}} />
           ) : (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>No items found.</Text>
             </View>
           )
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {item.imageUrl ? (
               <Image source={{ uri: item.imageUrl }} style={styles.realImagePlaceholder} />
            ) : (
               <View style={[styles.imagePlaceholder, { backgroundColor: getRandomColor(item.name) }]}>
                 <Text style={styles.imagePlaceholderText}>
                   {item.name ? item.name.substring(0, 1).toUpperCase() : '?'}
                 </Text>
               </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productPrice}>${item.price}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.supplierButton} 
                onPress={() => setSelectedSupplierProduct(item)}
              >
                <Text style={styles.supplierButtonText}>Supplier</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.buyButton} 
                onPress={() => handleBuy(item)}
              >
                <Text style={styles.buyButtonText}>Buy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={fetchProducts}
      />

      {/* Supplier Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedSupplierProduct}
        onRequestClose={() => setSelectedSupplierProduct(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedSupplierProduct && (() => {
            const supplier = getSupplierInfo(selectedSupplierProduct.name);
            return (
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={[styles.supplierAvatar, {backgroundColor: getRandomColor(supplier.name)}]}>
                    <Text style={styles.supplierAvatarText}>{supplier.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{supplier.name}</Text>
                </View>

                <View style={styles.modalBodyRow}>
                  <Text style={styles.modalLabel}>⭐ Rating</Text>
                  <Text style={styles.modalValue}>{supplier.rating} / 5.0</Text>
                </View>
                
                <View style={styles.modalBodyRow}>
                  <Text style={styles.modalLabel}>📍 Location</Text>
                  <Text style={styles.modalValue}>{supplier.location}</Text>
                </View>
                
                <View style={styles.modalBodyRow}>
                  <Text style={styles.modalLabel}>✉️ Contact</Text>
                  <Text style={styles.modalValue}>{supplier.contact}</Text>
                </View>

                <View style={styles.controlTag}>
                  <Text style={styles.controlTagText}>Verified by UMU Control App</Text>
                </View>

                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedSupplierProduct(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isProfileModalVisible}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { marginTop: 40 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={pickImage} style={{ marginBottom: 16 }}>
                <Image source={{ uri: userAvatar }} style={styles.supplierAvatar} />
                <View style={styles.editAvatarBadge}>
                  <Text style={styles.editAvatarText}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalInputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={userName}
                onChangeText={setUserName}
                placeholderTextColor={theme.textSub}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalInputLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={userPhone}
                onChangeText={setUserPhone}
                keyboardType="phone-pad"
                placeholderTextColor={theme.textSub}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalInputLabel}>About Me</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                value={userAbout}
                onChangeText={setUserAbout}
                multiline={true}
                placeholderTextColor={theme.textSub}
              />
            </View>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsProfileModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getRandomColor = (name: string) => {
  if (!name) return '#3B82F6';
  const colors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 50 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  
  topProfileBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  userInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  userAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: theme.card, 
    borderWidth: 2, 
    borderColor: theme.border 
  },
  userTextCol: { marginLeft: 12 },
  greetingText: { fontSize: 13, color: theme.textSub, fontWeight: '600' },
  userNameText: { fontSize: 16, color: theme.text, fontWeight: '800' },
  themeToggleBtn: { 
    padding: 10, 
    backgroundColor: theme.card, 
    borderRadius: 22, 
    borderWidth: 1, 
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },

  welcomeText: { fontSize: 34, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: theme.textSub, marginTop: 4, fontWeight: '500' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginTop: 20, borderWidth: 1, borderColor: theme.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: theme.text },
  
  categoryScroll: { marginTop: 20, marginBottom: 5 },
  categoryChip: { backgroundColor: theme.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: theme.border },
  activeCategoryChip: { backgroundColor: theme.primary, borderColor: theme.primary },
  categoryText: { color: theme.textSub, fontWeight: '600', fontSize: 14 },
  activeCategoryText: { color: '#FFF' },
  
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 20, marginBottom: 10 },
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: theme.textSub },
  
  productCard: { width: '48%', backgroundColor: theme.card, borderRadius: 16, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4, borderWidth: 1, borderColor: theme.border },
  imagePlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  realImagePlaceholder: { width: '100%', height: 120, resizeMode: 'cover', borderBottomWidth: 1, borderBottomColor: theme.border },
  imagePlaceholderText: { fontSize: 40, color: '#FFF', fontWeight: '800' },
  productInfo: { padding: 12, paddingBottom: 8 },
  productName: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 },
  productPrice: { fontSize: 16, color: theme.success, fontWeight: '800' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12 },
  
  supplierButton: { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.primary, marginRight: 6, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  supplierButtonText: { color: theme.primary, fontSize: 12, fontWeight: '700' },
  buyButton: { flex: 1, backgroundColor: theme.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buyButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: theme.modalOverlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: theme.card, borderRadius: 24, width: '100%', padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10, borderWidth: 1, borderColor: theme.border },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  supplierAvatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 4 }, borderWidth: 2, borderColor: theme.border },
  supplierAvatarText: { fontSize: 32, color: '#FFF', fontWeight: '800' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: theme.text, textAlign: 'center' },
  modalBodyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  modalLabel: { fontSize: 16, color: theme.textSub, fontWeight: '600' },
  modalValue: { fontSize: 16, color: theme.text, fontWeight: '700' },
  controlTag: { backgroundColor: 'rgba(52, 211, 153, 0.1)', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 24, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)' },
  controlTagText: { color: theme.success, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  inputGroup: { width: '100%', marginBottom: 16 },
  modalInputLabel: { fontSize: 14, color: theme.textSub, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  modalInput: { width: '100%', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, fontSize: 16 },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: -5, backgroundColor: theme.card, borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 },
  editAvatarText: { fontSize: 14 },
  
  modalCloseButton: { backgroundColor: theme.primary, marginTop: 15, paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  modalCloseButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
