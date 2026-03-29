import { useState, useEffect } from 'react';
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
  Modal
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FeedScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modal state for Supplier
  const [selectedSupplierProduct, setSelectedSupplierProduct] = useState<any>(null);

  const categories = ['All', 'Electronics', 'Books', 'Furniture', 'Clothing', 'Other'];

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

  useEffect(() => {
    fetchProducts();
  }, []);

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
        { text: "Confirm", onPress: () => Alert.alert("Success!", `Order Placed.`) }
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Text style={styles.welcomeText}>Campus Market</Text>
      <Text style={styles.subtitle}>Find what you need today.</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={22} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
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
             <ActivityIndicator size="large" color="#3B82F6" style={{marginTop: 50}} />
           ) : (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>No items found.</Text>
             </View>
           )
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={[styles.imagePlaceholder, { backgroundColor: getRandomColor(item.name) }]}>
               <Text style={styles.imagePlaceholderText}>
                 {item.name ? item.name.substring(0, 1).toUpperCase() : '?'}
               </Text>
            </View>
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
        animationType="fade"
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A', // Slate 900 (Deep business blue)
    paddingTop: 50
  },
  headerContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 5 
  },
  welcomeText: { 
    fontSize: 34, 
    fontWeight: '800', 
    color: '#F8FAFC', // Slate 50
    letterSpacing: -0.5 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#94A3B8', // Slate 400
    marginTop: 4, 
    fontWeight: '500' 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B', // Slate 800
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#F8FAFC' 
  },
  categoryScroll: { 
    marginTop: 20, 
    marginBottom: 5,
  },
  categoryChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  activeCategoryChip: { 
    backgroundColor: '#3B82F6', // Blue 500
    borderColor: '#3B82F6'
  },
  categoryText: { 
    color: '#94A3B8', 
    fontWeight: '600', 
    fontSize: 14 
  },
  activeCategoryText: { 
    color: '#FFFFFF' 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#F8FAFC', 
    marginTop: 20, 
    marginBottom: 10 
  },
  row: { 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 40 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#94A3B8' 
  },
  productCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#334155'
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { 
    fontSize: 40, 
    color: '#FFF', 
    fontWeight: '800' 
  },
  productInfo: { 
    padding: 12,
    paddingBottom: 8
  },
  productName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#F8FAFC', 
    marginBottom: 4 
  },
  productPrice: { 
    fontSize: 16, 
    color: '#34D399', // Emerald 400
    fontWeight: '800' 
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  supplierButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6', // Blue outline
    marginRight: 6,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  supplierButtonText: { 
    color: '#3B82F6', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#3B82F6', 
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  buyButtonText: { 
    color: '#FFF', 
    fontSize: 12, 
    fontWeight: '700' 
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    width: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  supplierAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: '#334155'
  },
  supplierAvatarText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '800'
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center'
  },
  modalBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  modalLabel: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600'
  },
  modalValue: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '700'
  },
  controlTag: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  controlTagText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  modalCloseButton: {
    backgroundColor: '#3B82F6',
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  modalCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800'
  }
});
