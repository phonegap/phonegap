ifndef QCONFIG
QCONFIG=qconfig.mk
endif
include $(QCONFIG)

NAME=pimcontacts
PLUGIN=yes
UTILS=yes

include ../../../../../../meta.mk

SRCS+=pim_contacts_qt.cpp \
      pim_contacts_js.cpp \
      contact_account.cpp

include $(MKFILES_ROOT)/qtargets.mk

LIBS+=bbpim bbcascadespickers QtCore img
