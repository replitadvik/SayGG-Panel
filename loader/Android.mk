# ============================================================
#  KeyPanel Android Native Loader — ndk-build
#
#  Required variables (set in Application.mk or gradle):
#    KEYPANEL_ENDPOINT  = https://yourserver.com/connect
#    KEYPANEL_GAME      = PUBG       (or BGMI, etc.)
#    KEYPANEL_SECRET    = your-production-secret
#
#  Optional:
#    KEYPANEL_PINNED_KEY = sha256//base64hash=
#    KEYPANEL_JNI_CLASS  = com/yourpkg/YourClass
# ============================================================

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE    := keypanel
LOCAL_SRC_FILES := Login.cpp

LOCAL_C_INCLUDES := $(LOCAL_PATH)

LOCAL_LDLIBS := -llog -lz
LOCAL_SHARED_LIBRARIES := libcurl libssl libcrypto

LOCAL_CPPFLAGS := -std=c++17 -fexceptions -frtti \
    -DENDPOINT_URL=\"$(KEYPANEL_ENDPOINT)\" \
    -DGAME_NAME=\"$(KEYPANEL_GAME)\" \
    -DLICENSE_SECRET=\"$(KEYPANEL_SECRET)\"

ifdef KEYPANEL_PINNED_KEY
LOCAL_CPPFLAGS += -DPINNED_PUBLIC_KEY=\"$(KEYPANEL_PINNED_KEY)\"
endif

ifdef KEYPANEL_JNI_CLASS
LOCAL_CPPFLAGS += -DJNI_CLASS_PATH=\"$(KEYPANEL_JNI_CLASS)\"
endif

include $(BUILD_SHARED_LIBRARY)

$(call import-module, curl)
$(call import-module, openssl)
