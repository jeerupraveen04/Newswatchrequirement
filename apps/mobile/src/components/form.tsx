import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { theme } from "../theme";

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TextField({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TextInput
        placeholderTextColor={theme.colors.muted}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.inputFocused, !!error && styles.inputError, props.style]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function PasswordField({
  label = "Password",
  error,
  ...props
}: TextInputProps & { label?: string; error?: string | null }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <View style={[styles.passwordRow, !!error && styles.inputError]}>
        <TextInput
          placeholderTextColor={theme.colors.muted}
          {...props}
          secureTextEntry={!visible}
          style={styles.passwordInput}
        />
        <Pressable hitSlop={8} onPress={() => setVisible((v) => !v)} accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"}>
          <Text style={[styles.eye, visible && { color: theme.colors.purple }]}>{visible ? "\u25C9" : "\u25CB"}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = busy || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={[styles.button, isDisabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonLabel}>{busy ? `${label}…` : label}</Text>
    </Pressable>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: theme.spacing[3] },
  label: { fontSize: 13, fontWeight: "600", color: theme.colors.mutedStrong, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    backgroundColor: theme.colors.white,
    color: theme.colors.text,
  },
  inputFocused: { borderColor: theme.colors.purple, backgroundColor: theme.colors.purpleLight },
  inputError: { borderColor: theme.colors.error },
  fieldError: { color: theme.colors.error, fontSize: 12, marginTop: 4 },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.white,
    paddingRight: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, height: 46, fontSize: 15, color: theme.colors.text },
  eye: { fontSize: 16, color: theme.colors.muted },
  button: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing[1],
  },
  buttonDisabled: { opacity: 0.5 },
  buttonLabel: { color: theme.colors.white, fontWeight: "700", fontSize: 15 },
  errorBox: {
    backgroundColor: "rgba(220,38,38,0.08)",
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: theme.spacing[3],
  },
  errorText: { color: theme.colors.error, fontSize: 13 },
});
