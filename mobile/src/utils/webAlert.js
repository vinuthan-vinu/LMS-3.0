/**
 * Cross-platform Alert & Confirm utility.
 *
 * On native (iOS/Android) we delegate to React Native Alert.
 * On web we use window.confirm for confirmations (gives the user a real Cancel button)
 * and window.alert for simple messages.
 *
 * We wrap in setTimeout(…, 0) so the call is deferred to the next microtask,
 * which prevents the browser from blocking React's render cycle and
 * ensures buttons remain responsive after a dialog is dismissed.
 */
import { Platform, Alert } from 'react-native';

/**
 * Show a simple informational message (OK button only).
 * @param {string}   title
 * @param {string}   message
 * @param {function} [onClose]  optional callback fired after dismiss
 */
export const showAlert = (title, message, onClose) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (typeof onClose === 'function') onClose();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
  }
};

/**
 * Show a confirmation dialog (OK / Cancel).
 */
export const showConfirm = (title, message, onConfirm, confirmText = 'OK') => {
  if (Platform.OS === 'web') {
    const yes = window.confirm(`${title}\n\n${message}`);
    if (yes && typeof onConfirm === 'function') {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
};
