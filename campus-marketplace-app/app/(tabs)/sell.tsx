import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';

export default function SellScreen() {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendPostRequest = async () => {
    if (!productName || !productPrice) {
      Alert.alert("Missing Fields", "Please fill out all fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch("http://10.18.0.192:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: productName, price: parseInt(productPrice) })
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
        <Text style={styles.subtitle}>Fill in the details below to sell your product to the campus.</Text>
        
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
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 24,
    lineHeight: 22
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
