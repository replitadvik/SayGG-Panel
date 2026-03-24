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

include $(BUILD_SHARED_LIBRARY)

$(call import-module, curl)
$(call import-module, openssl)
