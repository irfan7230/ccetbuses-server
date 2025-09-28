import React from 'react';
import { View, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { TextInput, IconButton, HelperText } from 'react-native-paper'; // Import HelperText
import { BlurView } from 'expo-blur';

interface EnhancedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  icon?: string;
  error?: string; // Add error prop
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({ 
  label, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default', 
  icon,
  error, // Destructure error
}) => {
  const [showPassword, setShowPassword] = React.useState(!secureTextEntry);

  return (
    <View style={styles.inputWrapper}>
      <BlurView intensity={25} tint="dark" style={styles.inputBlur}>
        <View style={styles.inputContainer}>
          {icon && <IconButton icon={icon} iconColor="rgba(255, 255, 255, 0.7)" size={20} />}
          <TextInput
            label={label}
            value={value}
            onChangeText={onChangeText}
            style={styles.input}
            keyboardType={keyboardType}
            autoCapitalize="none"
            mode="flat"
            secureTextEntry={secureTextEntry && !showPassword}
            underlineStyle={{ display: 'none' }}
            contentStyle={{ fontFamily: 'Inter_400Regular', color: '#FFFFFF' }}
            theme={{ colors: { onSurfaceVariant: 'rgba(255, 255, 255, 0.5)' } }}
            error={!!error} // Show error state on the input
          />
          {secureTextEntry && (
            <IconButton 
              icon={showPassword ? "eye-off" : "eye"} 
              iconColor="rgba(255, 255, 255, 0.7)" 
              size={20}
              onPress={() => setShowPassword(!showPassword)}
            />
          )}
        </View>
      </BlurView>
      {/* Display the error message below the input */}
      <HelperText type="error" visible={!!error} style={styles.helperText}>
        {error}
      </HelperText>
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: { marginBottom: 8 }, // Adjusted margin
  inputBlur: { borderRadius: 16, overflow: 'hidden' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'transparent', 
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  input: { flex: 1, backgroundColor: 'transparent', fontSize: 16 },
  helperText: {
    fontFamily: 'Inter_400Regular',
    paddingLeft: 8,
  },
});