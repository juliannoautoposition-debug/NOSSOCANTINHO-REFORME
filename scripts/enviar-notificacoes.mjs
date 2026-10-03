import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function enviarNotificacoes() {
  console.log("🔎 Procurando notificações pendentes...");

  const snapshot = await db
    .collectionGroup("pushQueue")
    .where("status", "==", "pending")
    .limit(100)
    .get();

  if (snapshot.empty) {
    console.log("✅ Nenhuma notificação pendente.");
    return;
  }

  for (const notificationDoc of snapshot.docs) {
    const notification = notificationDoc.data();

    const coupleId = notification.coupleId;
    const senderId = notification.senderId || "";
    const title = notification.title || "Nosso Cantinho ❤️";
    const body = notification.body || "Você recebeu uma nova atualização.";

    if (!coupleId) {
      console.log("⚠️ Notificação sem coupleId:", notificationDoc.id);
      continue;
    }

    const tokensSnapshot = await db
      .collection("casais")
      .doc(coupleId)
      .collection("pushTokens")
      .get();

    const tokens = [];

    tokensSnapshot.forEach((tokenDoc) => {
      const data = tokenDoc.data();

      if (
        data.token &&
        data.userId &&
        data.userId !== senderId
      ) {
        tokens.push(data.token);
      }
    });

    if (!tokens.length) {
      console.log("⚠️ Nenhum dispositivo encontrado para:", coupleId);
      continue;
    }

    console.log(
      `📨 Enviando "${title}" para ${tokens.length} dispositivo(s)...`
    );

    const messages = tokens.map((token) => ({
      token,
      notification: {
        title,
        body
      },
      data: {
        coupleId: String(coupleId),
        notificationId: String(notificationDoc.id)
      }
    }));

    try {
      const response = await messaging.sendEach(messages);

      console.log(
        `✅ Enviadas: ${response.successCount} | Falhas: ${response.failureCount}`
      );

      await notificationDoc.ref.update({
        status: "sent",
        sentAt: Date.now()
      });
    } catch (error) {
      console.error("❌ Erro ao enviar FCM:", error);

      await notificationDoc.ref.update({
        status: "error",
        error: String(error.message || error),
        updatedAt: Date.now()
      });
    }
  }
}

enviarNotificacoes()
  .then(() => {
    console.log("🏁 Processo finalizado.");
  })
  .catch((error) => {
    console.error("❌ Erro geral:", error);
    process.exit(1);
  });
