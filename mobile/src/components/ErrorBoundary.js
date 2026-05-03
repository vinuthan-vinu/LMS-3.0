import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={styles.container}>
          <Text style={styles.header}>Something went wrong.</Text>
          <Text style={styles.errorText}>{this.state.error && this.state.error.toString()}</Text>
          <Text style={styles.stackText}>{this.state.errorInfo && this.state.errorInfo.componentStack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fee' },
  header: { fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 10 },
  errorText: { fontSize: 16, color: 'darkred', marginBottom: 10, fontWeight: 'bold' },
  stackText: { fontSize: 12, color: 'black', fontFamily: 'monospace' },
});
