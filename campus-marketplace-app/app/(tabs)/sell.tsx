import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SellScreen() {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierName, setSupplierName] = useState('');

  useEffect(() => {
    // Check async storage dynamically if user switches tabs
    const fetchSupplier = async () => {
      try {
        const stored = await AsyncStorage.getItem('supplierAccount');
        if (stored) {
          const acc = JSON.parse(stored);
          setSupplierEmail(acc.email);
          setSupplierName(acc.name);
        } else {
          setSupplierEmail('');
          setSupplierName('');
        }
      } catch (e) {}
    };
    
    // Polling here is a quick hack to keep tabs synced in expo-router
    const interval = setInterval(fetchSupplier, 1500);
    fetchSupplier();
    return () => clearInterval(interval);
  }, []);

  const sendPostRequest = async () => {
    if (!supplierEmail) {
      Alert.alert("Supplier Required", "Please create a Supplier Portal account via the Portal tab first before listing an item.");
      return;
    }
    if (!productName || !productPrice) {
      Alert.alert("Missing Fields", "Please fill out all fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch("http://10.18.0.192:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: productName, 
          price: parseInt(productPrice),
          sellerName: supplierName,
          supplierContact: supplierEmail
        })
      });
      const data = await response.text();
      Alert.alert("Success", data);
      setProductName('');
      setProductPrice('');
    } catch (error) {
      Alert.alert("Error", "Failed to send data. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.formCard}>
        <Text style={styles.title}>List an Item</Text>
        
        {supplierEmail ? (
           <Text style={styles.subtitle}>Posting as verified supplier: {supplierName}</Text>
        ) : (
           <Text style={styles.warningText}>You must log in through the Portal tab first.</Text>
        )}
        
        <Text style={styles.label}>Product Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Rolex Watch" 
          placeholderTextColor="#94A3B8"
          value={productName}
          onChangeText={setProductName} 
        />
        
        <Text style={styles.label}>Price ($)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="199" 
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={productPrice}
          onChangeText={setProductPrice} 
        />
        
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={sendPostRequest}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Listing..." : "Post Item"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#0F172A' // Slate 900
  },
  formCard: {
    backgroundColor: '#1E293B', // Slate 800
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    marginBottom: 8, 
    textAlign: 'left',
    color: '#F8FAFC' 
  },
  subtitle: {
    fontSize: 14,
    color: '#34D399',
    marginBottom: 24,
    fontWeight: '600'
  },
  warningText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 24,
    fontWeight: '700'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1', // Slate 300
    marginBottom: 8,
    marginLeft: 4
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#334155', 
    padding: 16, 
    marginBottom: 20, 
    borderRadius: 12, 
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#3B82F6', // Blue 500
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  submitButtonDisabled: {
    backgroundColor: '#2563EB',
    opacity: 0.7
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
