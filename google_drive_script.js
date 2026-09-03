/**
 * =========================================================================
 * गौरादह नगरपालिका वडा नं. १ — Google Drive Auto-Backup Script (Apps Script)
 * =========================================================================
 * 
 * कसरी प्रयोग गर्ने (Step-by-Step Guide):
 * ---------------------------------------
 * १. आफ्नो कम्प्युटरमा Google Drive (drive.google.com) खोल्नुहोस्।
 * २. '+ New' मा थिचेर 'More' > 'Google Apps Script' छान्नुहोस्।
 * ३. खुलेको नयाँ सम्पादकमा भएको सबै कोड हटाएर तलको कोड Ctrl+V (Paste) गर्नुहोस्।
 * ४. माथि 'Deploy' (निलो बटन) > 'New deployment' मा थिच्नुहोस्।
 * ५. 'Select type' (दायाँ गियर आइकन) मा 'Web app' छान्नुहोस्।
 * ६. निम्न सेटिङ मिलाउनुहोस्:
 *    - Description: Ward 1 Backup Webhook
 *    - Execute as: Me (your-email@gmail.com)
 *    - Who has access: Anyone (ताकि वडा प्रणालीले सिधै ब्याकअप पठाउन सकोस्)
 * ७. 'Deploy' थिच्नुहोस् र Google Permissions लाई 'Allow' गर्नुहोस्।
 * ८. प्राप्त भएको 'Web app URL' (उदा: https://script.google.com/macros/s/.../exec) कपी गर्नुहोस्।
 * ९. वडा सिफारिस प्रणालीको Admin Dashboard (वा कन्सोल) मा गएर:
 *    localStorage.setItem('ward1_gdrive_webhook_url', 'तपाईंको_URL');
 *    राख्नुहोस्।
 * 
 * यति गरेपछि प्रत्येक ५ दिनमा सम्पूर्ण वडाको डाटा तपाईंको Google Drive मा आफैं सेभ हुनेछ!
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // १. प्राप्त ब्याकअप डाटा पार्स गर्ने
    var payload = JSON.parse(e.postData.contents);
    var now = new Date();
    var dateStr = Utilities.formatDate(now, "Asia/Kathmandu", "yyyy-MM-dd_HH-mm");
    
    // २. Google Drive मा 'गौरादह वडा १ सिफारिस ब्याकअप' फोल्डर खोज्ने वा नयाँ बनाउने
    var folderName = "गौरादह वडा १ सिफारिस ब्याकअप";
    var folders = DriveApp.getFoldersByName(folderName);
    var targetFolder;
    
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(folderName);
    }
    
    // ३. फोल्डरभित्र नयाँ JSON ब्याकअप फाइल सुरक्षित गर्ने
    var fileName = "Ward1_Sifarish_Backup_" + dateStr + ".json";
    var fileContent = JSON.stringify(payload, null, 2);
    var createdFile = targetFolder.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Backup saved successfully to Google Drive",
      fileName: fileName,
      fileId: createdFile.getId(),
      folderName: folderName
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("✅ Gauradaha Ward 1 Auto-Backup Webhook is ACTIVE and Ready.");
}
