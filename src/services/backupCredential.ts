// Le mot de passe utile au chiffrement des exports ne quitte pas la mémoire.
let password = '';
export const getBackupPassword = () => password;
export const setBackupPassword = (value: string) => { password = value; };
if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('encryption_pin');
