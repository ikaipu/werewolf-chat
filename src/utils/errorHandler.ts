type ErrorCode = 
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/invalid-email'
  | 'auth/operation-not-allowed'
  | 'auth/account-exists-with-different-credential'
  | 'auth/invalid-credential'
  | 'auth/user-disabled'
  | 'auth/too-many-requests'
  | 'auth/network-request-failed'
  | 'room/not-found'
  | 'room/access-denied'
  | 'unknown';

const errorMessages: Record<ErrorCode, string> = {
  'auth/user-not-found': 'ユーザーが見つかりません。',
  'auth/wrong-password': 'パスワードが間違っています。',
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています。',
  'auth/weak-password': 'パスワードが弱すぎます。',
  'auth/invalid-email': '無効なメールアドレスです。',
  'auth/operation-not-allowed': 'この操作は許可されていません。',
  'auth/account-exists-with-different-credential': 'このメールアドレスは既に別の認証方法で使用されています。',
  'auth/invalid-credential': '無効な認証情報です。',
  'auth/user-disabled': 'このアカウントは無効化されています。',
  'auth/too-many-requests': 'リクエストが多すぎます。しばらく待ってから再試行してください。',
  'auth/network-request-failed': 'ネットワークエラーが発生しました。',
  'room/not-found': 'ルームが見つかりません。',
  'room/access-denied': 'ルームへのアクセスが拒否されました。',
  'unknown': '予期せぬエラーが発生しました。'
};

export const getErrorMessage = (code: string): string => {
  return errorMessages[code as ErrorCode] || errorMessages.unknown;
};