import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";

const AlertContext = createContext(null);

// Mirrors React Native's Alert.alert(title, message, buttons) signature so
// existing call sites only need `Alert.alert(...)` swapped for `alert(...)`.
export function AlertProvider({ children }) {
  const [config, setConfig] = useState(null);

  const alert = useCallback((title, message, buttons) => {
    const resolvedButtons =
      buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];
    setConfig({ title, message, buttons: resolvedButtons });
  }, []);

  const dismiss = useCallback(() => setConfig(null), []);

  const handleButtonPress = (button) => {
    dismiss();
    // Let the modal close before firing the callback so any navigation or
    // state change triggered by onPress doesn't fight the closing animation.
    setTimeout(() => {
      button.onPress?.();
    }, 0);
  };

  const value = useMemo(() => ({ alert }), [alert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(config)}
        transparent
        animationType="fade"
        onRequestClose={dismiss}
      >
        <Pressable style={styles.backdrop} onPress={dismiss}>
          <Pressable style={styles.card} onPress={() => {}}>
            {config?.title ? (
              <Text style={styles.title}>{config.title}</Text>
            ) : null}
            {config?.message ? (
              <Text style={styles.message}>{config.message}</Text>
            ) : null}

            <View
              style={[
                styles.buttonRow,
                config?.buttons?.length > 2 && styles.buttonColumn,
              ]}
            >
              {config?.buttons?.map((button, index) => (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.button,
                    button.style === "destructive" && styles.destructiveButton,
                    button.style === "cancel" && styles.cancelButton,
                    config.buttons.length > 2 && styles.buttonFullWidth,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === "destructive" &&
                        styles.destructiveButtonText,
                      button.style === "cancel" && styles.cancelButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const value = useContext(AlertContext);
  if (!value) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return value;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(61, 43, 31, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFF8EE",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E5444",
    textAlign: "center",
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  buttonColumn: {
    flexDirection: "column",
  },
  button: {
    flex: 1,
    backgroundColor: "#7A4B2F",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonFullWidth: {
    flex: undefined,
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#F0E3D2",
  },
  destructiveButton: {
    backgroundColor: "#A84B3C",
  },
  buttonText: {
    color: "#FFF9F3",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelButtonText: {
    color: "#6E5444",
  },
  destructiveButtonText: {
    color: "#FFF9F3",
  },
});
