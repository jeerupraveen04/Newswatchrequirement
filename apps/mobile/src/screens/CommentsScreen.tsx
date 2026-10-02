import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { useComments, usePostComment, useToggleLike, formatRelative, type Comment } from "../lib/queries";
import { theme } from "../theme";
import { ScreenshotEmpty } from "../components/ui";
import type { RootStackNavigation, RootStackParamList } from "../navigation/types";

export function CommentsScreen() {
  const navigation = useNavigation<RootStackNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, "Comments">>();
  const articleId = route.params.articleId;
  const user = useAuth((s) => s.user);
  const { data, isLoading, refetch, isRefetching } = useComments(articleId);
  const post = usePostComment(articleId);
  const like = useToggleLike();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  async function send() {
    if (!text.trim()) return;
    await post.mutateAsync({ body: text.trim(), parentId: replyTo?.id });
    setText("");
    setReplyTo(null);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <FlatList
        data={data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: theme.spacing[4] }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={!isLoading ? <ScreenshotEmpty icon="&#128172;" message="No comments yet. Be the first." /> : null}
        renderItem={({ item }) => (
          <CommentRow
            comment={item}
            depth={0}
            onReply={(c) => {
              if (!user) return navigation.navigate("Login");
              setReplyTo(c);
            }}
            onLike={(c) => {
              if (!user) return navigation.navigate("Login");
              like.mutate({ targetType: "comment", targetId: c.id });
            }}
          />
        )}
      />

      <View style={styles.composer}>
        {replyTo ? (
          <View style={styles.replyChip}>
            <Text style={styles.replyText}>Replying to @{replyTo.author?.username ?? "user"}</Text>
            <Pressable onPress={() => setReplyTo(null)}>
              <Text style={styles.replyClose}>{"\u2715"}</Text>
            </Pressable>
          </View>
        ) : null}
        {user ? (
          <>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment…"
              style={styles.input}
              multiline
            />
            <Pressable style={[styles.send, !text.trim() && { opacity: 0.5 }]} disabled={!text.trim() || post.isPending} onPress={send}>
              <Text style={styles.sendText}>{post.isPending ? "…" : "Send"}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.loginPrompt} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginText}>Log in to comment</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentRow({
  comment,
  depth,
  onReply,
  onLike,
}: {
  comment: Comment;
  depth: number;
  onReply: (c: Comment) => void;
  onLike: (c: Comment) => void;
}) {
  return (
    <View style={{ marginLeft: depth * 20, marginBottom: theme.spacing[3] }}>
      <View style={styles.commentHead}>
        <Text style={styles.author}>{comment.author?.displayName ?? "User"}</Text>
        {comment.author?.role === "reporter" ? <Text style={styles.reporterTag}>Reporter</Text> : null}
        <Text style={styles.time}>· {formatRelative(comment.createdAt)}</Text>
      </View>
      <Text style={styles.body}>{comment.body}</Text>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
        <Pressable onPress={() => onLike(comment)}>
          <Text style={styles.replyAction}>{"\u2661"} {comment.likeCount > 0 ? comment.likeCount : "Like"}</Text>
        </Pressable>
        <Pressable onPress={() => onReply(comment)}>
          <Text style={styles.replyAction}>Reply</Text>
        </Pressable>
      </View>
      {comment.replies?.map((r) => (
        <CommentRow key={r.id} comment={r} depth={depth + 1} onReply={onReply} onLike={onLike} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  commentHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  author: { fontWeight: "700", color: theme.colors.text, fontSize: 14 },
  reporterTag: { color: theme.colors.purple, fontSize: 11, fontWeight: "700" },
  time: { color: theme.colors.muted, fontSize: 12 },
  body: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 2 },
  replyAction: { color: theme.colors.muted, fontWeight: "600", fontSize: 12 },
  composer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing[3],
    backgroundColor: theme.colors.white,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing[2],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    color: theme.colors.text,
  },
  send: { backgroundColor: theme.colors.purple, borderRadius: theme.radius.pill, paddingHorizontal: 18, height: 40, justifyContent: "center" },
  sendText: { color: theme.colors.white, fontWeight: "700" },
  loginPrompt: { flex: 1, alignItems: "center", padding: 12 },
  loginText: { color: theme.colors.purple, fontWeight: "700" },
  replyChip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.colors.purpleLight, borderRadius: theme.radius.md, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 },
  replyText: { color: theme.colors.purple, fontSize: 12, fontWeight: "600" },
  replyClose: { color: theme.colors.purple, fontWeight: "800" },
});
